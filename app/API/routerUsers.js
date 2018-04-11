var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');
var express = require('express');
var crypto = require('crypto');
var path = require('path');
var dateFormat = require('dateformat');

// Modelli
var Utente = require("../models/utente");
var Parcheggio = require("../models/parcheggio");
var Carta = require("../models/cartaDiCredito");
var VerificaEmail = require("../models/verificaEmail");
var Prenotazione = require("../models/prenotazione");
var PrenotazionePagata = require("../models/prenotazionePagata");

// Localstorage interno per salvare il numero dei posti liberi (senza doverlo ricalcolare da mysql ad ogni richiesta)
var Storage = require('../storage/Storage');

// Servizio posta elettronica
var EmailSender = require('../EmailSender');
// Servizio MatrixDistance GoogleMap API
var DistastanceCalculator = require('../DistanceCalculatorGoogleMap');

// Configurazioni varie
var ConfigConnessione = require("../config/configConnessione");
var TipoPosto = require("../config/configTipoPosto");

//  Verifica del token
var verifyToken = function (req, res, next) {
    var token = req.headers['x-access-token'] || req.body.token || req.query.token;

    if (token) {
        jwt.verify(token, ConfigConnessione.secret, function (err, decoded) {
            if (err)
                return res.json({
                    error: {
                        codice: -1,
                        info: "Riscontrati problemi nell' autenticare il token."
                    }
                });
            else {
                req.user = decoded;
                next();
            }
        });
    } else {
        return res.status(400).json({
            error: {
                codice: 15,
                info: "Devi essere loggato per eseguire quest' azione."
            }
        });
    }
};

// Cancellazione automatica delle prenotazioni scadute
var PrenotazioneScaduta = function (idPrenotazione, idUtente) {
    Prenotazione.getPrenotazioneUtente(idUtente, idPrenotazione, function (err, rows) {
        if (err)
            console.log("Impossibile cancellare la prenotazione (id:" + idPrenotazione + ") riscontrati problemi con il database nella ricerca.");
        else // Se la prenotazione è ancora nel database
            if (rows.length == 1) {
                datap = rows[0].data_scadenza;
                idParcheggio = rows[0].id_parcheggio;
                Prenotazione.delPrenotazione(idPrenotazione, function (err) {
                    if (err)
                        console.log("Impossibile cancellare la prenotazione (id:" + idPrenotazione + ") riscontrati problemi con il database nella cancellazione.");
                    else {
                        console.log("Prenotazione scaduta eliminata con successo (id: " + idPrenotazione + ", scaduta il " + datap.toLocaleString('it-IT', { hour12: false }) + ").");
                        // Aggiorno il numero dei posti liberi
                        Storage.getAllPostiLiberi(function (err, data) {
                            if (err)
                                console.log("Attenzione!\nErrore nell' aggiornare il numero di posti liberi (in lettura).");
                            else
                                for (var i = 0; i < data.length; i++)
                                    if (data[i].id_parcheggio == idParcheggio) {
                                        switch (data[i].id_tipo_posto) {
                                            case TipoPosto.auto:
                                                data[i].auto++;
                                                break;
                                            case TipoPosto.autobus:
                                                data[i].autobus++;
                                                break;
                                            case TipoPosto.camper:
                                                data[i].camper++;
                                                break;
                                            case TipoPosto.moto:
                                                data[i].moto++;
                                                break;
                                            case TipoPosto.disabile:
                                                data[i].disabile++;
                                                break;
                                        }

                                        Storage.updatePostiLiberi(data, function (err) {
                                            if (err)
                                                console.log("Attenzione!\nErrore nell' aggiornare il numero di posti liberi (in scrittura).");
                                        });
                                        break;
                                    }
                        });
                    }
                });
            }
    });
};

// Ricarico i posti liberi dal server
Storage.loadPostiLiberiFromServer(function () {
    // Ricarico i timer della scadenza di tutte le prenotazoni in atto
    Prenotazione.getAllPrenotazioni(function (err, rows) {
        if (err)
            console.log("Errore! Impossibile caricare le prenotazioni in atto.");
        else {
            for (var i = 0; i < rows.length; i++) {
                var now = new Date();
                var datetime = rows[i].data_scadenza.getFullYear() + "-" + (rows[i].data_scadenza.getMonth() + 1) + "-" + rows[i].data_scadenza.getDate() +
                    " " + rows[i].data_scadenza.getHours() + ":" + rows[i].data_scadenza.getMinutes() + ":" + rows[i].data_scadenza.getSeconds();

                var timer = new Date(datetime).getTime() - now.getTime();

                if (timer < 0)
                    timer = 100; // 0.1 secondi

                // Setto il timer per la cancellazione automatica alla scadenza della prenotaizone
                setTimeout(PrenotazioneScaduta, timer, rows[i].id_prenotazione, rows[i].id_utente);
            }
            console.log("Timer prenotazioni in atto reimpostati.");
        }
    });
});

// API ROUTES -------------------
var apiRoutes = express.Router();

// use body parser so we can get info from POST and/or URL parameters
apiRoutes.use(bodyParser.urlencoded({ extended: false }));
apiRoutes.use(bodyParser.json());

apiRoutes.post('/signup', function (req, res) {
    if (req.body.autista == undefined)
        res.status(400).json({
            error: {
                codice: 7,
                info: "Campi mancanti."
            }
        });
    else
        Utente.addAutista(req.body.autista, function (err, result) {
            if (err)
                res.status(400).json({
                    error: {
                        codice: 50,
                        info: "Nome utente o email già in uso."
                    }
                });
            else {
                // Genero il codice di verifica
                var milliseconds = new Date().getMilliseconds();
                var data = milliseconds + result.insertId;
                var codice = crypto.createHash('md5').update(data.toString()).digest('hex') + result.insertId;

                // Aggiungo il codice di verifica al database
                VerificaEmail.addEmailCode(result.insertId, codice, function (err) {
                    if (err)
                        res.status(400).json({
                            error: {
                                codice: 59,
                                info: "Riscontrati problemi con il database per la verifica email."
                            }
                        });
                    else {
                        // Setto i dati per l'invio dell' email di verifica
                        var indirizzo = "http://" + ConfigConnessione.ipExternal + ":" + ConfigConnessione.portExternal + "/verify?code=" + codice;
                        var testo = "Ciao " + req.body.autista.nome + ",\ngrazie per esserti iscritto alla nostra applicazione." + "\n\nSegui il link per procedere con la registrazione:\n" + indirizzo;

                        //  Invio l'email di verifica
                        EmailSender.sendEmail(req.body.autista.email, "Conferma registrazione ParkingUnicam", testo,
                            function (err, info) {
                                if (err)
                                    console.log("Email sender error > " + err);
                            });

                        res.json({
                            successful: {
                                codice: 200,
                                info: "Ti stiamo inviando un email per confermare la registrazione."
                            }
                        });
                    }
                });
            }
        });
});

// Verifica email (acceduta solo da browser, risponde con status 200 e con pagine html)
apiRoutes.get('/verify', function (req, res) {
    if (req.query.code == undefined)
        res.sendFile(path.join(__dirname, './html/errorRegistrazione.html'));
    else
        VerificaEmail.getEmailCode(req.query.code, function (err, rows) {
            if (err)
                res.sendFile(path.join(__dirname, './html/errorRegistrazione.html'));
            else {
                // Abilito l'autista
                if (rows.length == 1) {
                    var idUtente = rows[0].id_utente;
                    Utente.setAbilitazioneAutista(idUtente, 1, function (err) {
                        if (err)
                            res.sendFile(path.join(__dirname, './html/errorRegistrazione.html'));
                        else {
                            res.sendFile(path.join(__dirname, './html/confermaRegistrazione.html'));

                            console.log("Codice email verificato (account abilitato), codice > " + req.query.code);
                            // Elimino il record di verifica dell' utente
                            VerificaEmail.delEmailCode(idUtente, function (err) {
                                if (err)
                                    console.log("Riscontrato problema nell' eliminare EmailCode >\n" + err);
                            });
                        }
                    });
                    return; // Altrimenti node passa all' else successivo anche se non dovrebbe
                }
                else
                    if (rows.length > 1) {
                        res.sendFile(path.join(__dirname, './html/errorRegistrazione.html'));
                        console.log("Riscontrato problema nel database, trovato codice verifica duplicato.\n");
                    }
                    else
                        res.sendFile(path.join(__dirname, './html/alreadyRegistrazione.html'));
            }
        });
});

apiRoutes.post('/login', function (req, res) {
    console.log("Login request from: " + req.ip);
    if (req.body.username == undefined || req.body.password == undefined)
        res.status(400).json({
            error: {
                codice: 7,
                info: "Campi mancanti."
            }
        });
    else {
        if (req.body.admin == undefined)
            Utente.getAutistaFromUsername(req.body.username, req.body.password, function (err, rows) {
                if (err)
                    res.status(400).json({
                        error: {
                            codice: 50,
                            info: "Riscontrati problemi con il database."
                        }
                    });
                else
                    if (rows.length == 1) {
                        var user = {
                            id: rows[0].idUtente,
                            username: rows[0].username,
                            email: rows[0].email,
                            password: rows[0].password,
                            nome: rows[0].nome,
                            cognome: rows[0].cognome,
                            dataDiNascita: rows[0].dataDiNascita,
                            telefono: rows[0].telefono,
                            saldo: rows[0].saldo,
                            carta_di_credito: {
                                numero_carta: rows[0].numeroCarta,
                                pin: rows[0].pinDiVerifica,
                                dataDiScadenza: rows[0].dataDiScadenza
                            }
                        };
                        res.json({
                            token: jwt.sign(user, ConfigConnessione.secret),
                            autista: user
                        });
                    }
                    else
                        Utente.getAutistaFromEmail(req.body.username, req.body.password, function (err, rows) {
                            if (err)
                                res.status(400).json({
                                    error: {
                                        codice: 50,
                                        info: "Riscontrati problemi con il database."
                                    }
                                });
                            else
                                if (rows.length == 1) {
                                    var user = {
                                        id: rows[0].idUtente,
                                        username: rows[0].username,
                                        email: rows[0].email,
                                        password: rows[0].password,
                                        nome: rows[0].nome,
                                        cognome: rows[0].cognome,
                                        dataDiNascita: rows[0].dataDiNascita,
                                        telefono: rows[0].telefono,
                                        saldo: rows[0].saldo,
                                        carta_di_credito: {
                                            numero_carta: rows[0].numeroCarta,
                                            pin: rows[0].pinDiVerifica,
                                            dataDiScadenza: rows[0].dataDiScadenza
                                        }
                                    };
                                    res.json({
                                        token: jwt.sign(user, ConfigConnessione.secret),
                                        autista: user
                                    });
                                }
                                else {
                                    res.status(400).json({
                                        error: {
                                            codice: 7,
                                            info: "Dati di login errati o account non ancora abilitato."
                                        }
                                    });
                                }
                        });
            });
        else
            Utente.getAdmin(req.body.username, req.body.password, function (err, rows) {
                if (err)
                    res.status(400).json({
                        error: {
                            codice: 53,
                            info: "Riscontrati problemi con il database."
                        }
                    });
                else
                    if (rows.length == 1) {
                        var user = {
                            id: rows[0].idUtente,
                            username: rows[0].username,
                            email: rows[0].email,
                            password: rows[0].password,
                            nome: rows[0].nome,
                            cognome: rows[0].cognome,
                            livelloAmministrazione: rows[0].livelloAmministrazione
                        };
                        res.json({
                            token: jwt.sign(user, ConfigConnessione.secret),
                            admin: user
                        });
                    }
                    else {
                        res.status(400).json({
                            error: {
                                codice: 7,
                                info: "Dati di login errati."
                            }
                        });
                    }
            });
    }
});

apiRoutes.post('/getAllParcheggi', function (req, res) {
    Parcheggio.getAllParcheggi(function (err, rows) {
        if (err)
            res.status(400).json({
                error: {
                    codice: 48,
                    info: "Riscontrati problemi con il database."
                }
            });
        else
            if (rows.length > 0) {
                Storage.getAllPostiLiberi(function (err, posti) {
                    if (err)
                        console.log("Attenzione!\nRiscontrati errori nel caricamento dei posti liberi.");
                    else {
                        var parcheggi = [];
                        var parcheggio;

                        for (var i = 0; i < rows.length; i++) {
                            parcheggio = {
                                id: rows[i].idParcheggio,
                                indirizzo: {
                                    citta: rows[i].citta,
                                    provincia: rows[i].provincia,
                                    cap: rows[i].cap,
                                    via: rows[i].via,
                                    n_civico: rows[i].numero_civico
                                },
                                coordinate: {
                                    x: rows[i].coordinataX,
                                    y: rows[i].coordinataY
                                },
                                tariffaOrariaLavorativi: rows[i].tariffaOrariaLavorativi,
                                tariffaOrariaFestivi: rows[i].tariffaOrariaFestivi,
                                macBT: ConfigConnessione.mac
                            };

                            for (var k = 0; k < posti.length; k++)
                                if (posti[k].id_parcheggio == rows[i].idParcheggio) {
                                    parcheggio.nPostiMacchina = posti[k].auto || 0;
                                    parcheggio.nPostiAutobus = posti[k].autobus || 0;
                                    parcheggio.nPostiCamper = posti[k].camper || 0;
                                    parcheggio.nPostiMoto = posti[k].moto || 0;
                                    parcheggio.nPostiDisabile = posti[k].disabile || 0;
                                }

                            parcheggi[i] = parcheggio;
                        }

                        res.json({
                            parcheggi: parcheggi
                        });
                    }
                });
            }
            else
                res.status(400).json({
                    error: {
                        codice: 46,
                        info: "Non sono presenti percheggi nel database."
                    }
                });
    });
});

apiRoutes.post('/getAllBaseParcheggi', function (req, res) {
    Parcheggio.getParcheggiConPostiTotali(function (err, rows) {
        if (err)
            res.status(400).json({
                error: {
                    codice: 48,
                    info: "Riscontrati problemi con il database."
                }
            });
        else
            if (rows.length > 0) {
                var parcheggi = [];
                var parcheggio = null;
                var id = -1;
                var l = 0;

                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].idParcheggio != id) {
                        if (parcheggio != null) {
                            parcheggi[l] = parcheggio;
                            l++;
                        }

                        id = rows[i].idParcheggio;

                        parcheggio = {
                            id: rows[i].idParcheggio,
                            indirizzo: {
                                citta: rows[i].citta,
                                provincia: rows[i].provincia,
                                cap: rows[i].cap,
                                via: rows[i].via,
                                n_civico: rows[i].numero_civico
                            },
                            coordinate: {
                                x: rows[i].coordinataX,
                                y: rows[i].coordinataY
                            },
                            key: rows[i].key,
                            tariffaOrariaLavorativi: rows[i].tariffaOrariaLavorativi,
                            tariffaOrariaFestivi: rows[i].tariffaOrariaFestivi,
                            macBT: ConfigConnessione.mac
                        };
                    }

                    switch (rows[i].id_tipo) {
                        case TipoPosto.auto:
                            parcheggio.nPostiMacchina = rows[i].numero_posti;
                            break;
                        case TipoPosto.autobus:
                            parcheggio.nPostiAutobus = rows[i].numero_posti;
                            break;
                        case TipoPosto.camper:
                            parcheggio.nPostiCamper = rows[i].numero_posti;
                            break;
                        case TipoPosto.moto:
                            parcheggio.nPostiMoto = rows[i].numero_posti;
                            break;
                        case TipoPosto.disabile:
                            parcheggio.nPostiDisabile = rows[i].numero_posti;
                            break;
                    }
                }

                if (parcheggio != null)
                    parcheggi[l] = parcheggio;

                res.json({
                    parcheggi: parcheggi
                });
            }
            else
                res.status(400).json({
                    error: {
                        codice: 46,
                        info: "Non sono presenti percheggi nel database."
                    }
                });
    });
});

apiRoutes.post('/resetPassword', function (req, res) {
    if (req.body.email == undefined)
        res.status(400).json({
            error: {
                codice: 17,
                info: "Campi mancanti."
            }
        });
    else // Ritorna i dati dell' autista dall' email solo se esso è abilitato
        Utente.getAutistaFromOnlyEmail(req.body.email, function (err, rows) {
            if (err)
                res.status(400).json({
                    error: {
                        codice: 55,
                        info: "Riscontrati problemi con il database."
                    }
                });
            else
                if (rows.length == 1) {
                    // Creo la nuova password
                    var milliseconds = new Date().getMilliseconds();
                    var newPassword = milliseconds + rows[0].idUtente;
                    // Eseguo l'hash della password per salvarla nel db
                    var hashedPassword = crypto.createHash('sha1').update(newPassword.toString()).digest('hex');

                    var user = {
                        id: rows[0].idUtente,
                        username: rows[0].username,
                        email: rows[0].email,
                        password: hashedPassword,
                        nome: rows[0].nome,
                        cognome: rows[0].cognome,
                        dataDiNascita: rows[0].dataDiNascita,
                        telefono: rows[0].telefono,
                        saldo: rows[0].saldo,
                        abilitato: 1, // Se si arriva qui l'utente è obbligatoriamente abilitato
                        carta_di_credito: {
                            numero_carta: rows[0].numeroCarta,
                            pin: rows[0].pinDiVerifica,
                            dataDiScadenza: rows[0].dataDiScadenza
                        }
                    };

                    Utente.updateAutista(user, function (err) {
                        if (err) {
                            res.status(400).json({
                                error: {
                                    codice: 61,
                                    info: "Riscontrati problemi con il database nel resettare la password."
                                }
                            });
                        }
                        else {
                            EmailSender.sendEmail(user.email, "ParkingApp reset password",
                                "La tua nuova password è: " + newPassword + ".");

                            res.json({
                                successful: {
                                    codice: 210,
                                    info: "Ti è stata inviata un email con la nuova password."
                                }
                            });
                        }
                    });
                    return;
                }
                else
                    res.status(400).json({
                        error: {
                            codice: 95,
                            info: "Nessun account è registrato con questa email."
                        }
                    })
        });
});


//  #### da qui in poi è necessaria l'autenticazione via token ####
apiRoutes.use(verifyToken);

apiRoutes.post('/getAllAutisti', function (req, res) {
    if (req.user.livelloAmministrazione == undefined)
        res.status(400).json({
            error: {
                codice: 500,
                info: "Devi avere i diritti di amministratore."
            }
        });
    else
        if (req.user.livelloAmministrazione > 0)
            Utente.getAllAutisti(function (err, rows) {
                if (err)
                    res.status(400).json({
                        error: {
                            codice: 78,
                            info: "Riscontrati problemi con il database."
                        }
                    });
                else
                    if (rows.length > 0) {
                        var autisti = [];
                        var autista;

                        for (var i = 0; i < rows.length; i++) {
                            var dateN, dateS;

                            if (!rows[i].dataDiNascita)
                                dateN = "";
                            else {
                                var app = new Date(rows[i].dataDiNascita);
                                dateN = app.getFullYear() + "-" + (app.getMonth() + 1) + "-" + app.getDate();
                            }

                            if (!rows[i].dataDiScadenza)
                                dateS = "";
                            else {
                                var app = new Date(rows[i].dataDiScadenza);
                                dateS = app.getFullYear() + "-" + (app.getMonth() + 1) + "-" + app.getDate();
                            }

                            autista = {
                                id: rows[i].idUtente,
                                username: rows[i].username,
                                email: rows[i].email,
                                password: rows[i].password,
                                nome: rows[i].nome,
                                cognome: rows[i].cognome,
                                dataDiNascita: dateN,
                                telefono: rows[i].telefono || "",
                                saldo: rows[i].saldo || 0,
                                abilitato: rows[i].abilitato,
                                carta_di_credito: {
                                    numero_carta: rows[i].numeroCarta || "",
                                    pin: rows[i].pinDiVerifica || "",
                                    dataDiScadenza: dateS
                                }
                            };
                            autisti[i] = autista;
                        }

                        res.json({
                            autisti: autisti
                        });
                    }
                    else
                        res.status(400).json({
                            error: {
                                codice: 46,
                                info: "Non sono presenti percheggi nel database."
                            }
                        });
            });
        else
            res.status(400).json({
                error: {
                    codice: 500,
                    info: "Devi avere dei privilegi più alti."
                }
            });
});

apiRoutes.delete('/deleteAutista', function (req, res) {
    if (req.body.id == undefined)
        res.status(400).json({
            error: {
                codice: 7,
                info: "Campi mancanti."
            }
        });
    else
        if (req.user.livelloAmministrazione == undefined)
            res.status(400).json({
                error: {
                    codice: 500,
                    info: "Devi avere i diritti di amministratore."
                }
            });
        else
            if (req.user.livelloAmministrazione > 0) {
                Utente.delAutista(req.body.id, function (err) {
                    if (err)
                        res.status(400).json({
                            error: {
                                codice: 53,
                                info: "Riscontrati problemi con il database."
                            }
                        });
                    else
                        res.json({
                            successful: {
                                codice: 210,
                                info: "L'utente è stato eliminato correttamente."
                            }
                        });
                });
            }
            else
                res.status(400).json({
                    error: {
                        codice: 500,
                        info: "Devi avere dei privilegi più alti."
                    }
                });
});

apiRoutes.patch('/cambiaCredenziali', function (req, res) {
    if (req.body.autista == undefined)
        res.status(400).json({
            error: {
                codice: 7,
                info: "Campi mancanti."
            }
        });
    else
        if (req.user.livelloAmministrazione == undefined) { // L'autista ha richiesto la modifica dei propri dati
            // Correggo i dati dell' autista (es: aggiungo i campi mancanti con i dati che già conosco)
            Utente.CorreggiAutista(req.body.autista, req.user, function (resu) {
                req.body.autista = resu;
                Utente.updateAutista(req.body.autista, function (err) {
                    if (err)
                        res.status(400).json({
                            error: {
                                codice: 51,
                                info: "Riscontrati problemi con il database."
                            }
                        });
                    else
                        if (req.body.autista.carta_di_credito == undefined)
                            res.json({
                                successful: {
                                    codice: 210,
                                    info: "I dati utente sono stati aggiornati correttamente."
                                }
                            });
                        else
                            if (req.body.autista.carta_di_credito.pin == undefined || req.body.autista.carta_di_credito.numero_carta == undefined || req.body.autista.carta_di_credito.dataDiScadenza == undefined)
                                res.json({
                                    successful: {
                                        codice: 210,
                                        info: "I dati utente sono stati aggiornati correttamente."
                                    }
                                });
                            else
                                Carta.getCartaFromIdUtente(req.body.autista.id, function (err, rows) {
                                    if (err)
                                        res.status(400).json({
                                            error: {
                                                codice: 51,
                                                info: "Riscontrati problemi con il database, dati carta non aggiornati."
                                            }
                                        });
                                    else
                                        if (rows.length == 0)
                                            Carta.addCarta(req.body.autista, function (err) {
                                                if (err)
                                                    res.status(400).json({
                                                        error: {
                                                            codice: 51,
                                                            info: "Riscontrati problemi con il database, dati carta non aggiornati."
                                                        }
                                                    });
                                                else
                                                    res.json({
                                                        successful: {
                                                            codice: 210,
                                                            info: "I dati utente e della carta sono stati aggiornati correttamente."
                                                        }
                                                    });
                                            });
                                        else
                                            Carta.updateCarta(req.body.autista, function (err) {
                                                if (err)
                                                    res.status(400).json({
                                                        error: {
                                                            codice: 51,
                                                            info: "Riscontrati problemi con il database, dati carta non aggiornati."
                                                        }
                                                    });
                                                else
                                                    res.json({
                                                        successful: {
                                                            codice: 210,
                                                            info: "I dati utente e della carta sono stati aggiornati correttamente."
                                                        }
                                                    });
                                            });
                                });
                });
            });
        }
        else
            if (req.user.livelloAmministrazione > 0) // L'amministratore ha richiesto la modifica dei dati di un utente
                Utente.updateAutista(req.body.autista, function (err) {
                    if (err)
                        res.status(400).json({
                            error: {
                                codice: 51,
                                info: "Riscontrati problemi con il database."
                            }
                        });
                    else
                        if (req.body.autista.carta_di_credito == undefined)
                            res.json({
                                successful: {
                                    codice: 210,
                                    info: "I dati utente sono stati aggiornati correttamente."
                                }
                            });
                        else
                            if (!req.body.autista.carta_di_credito.pin || !req.body.autista.carta_di_credito.numero_carta || !req.body.autista.carta_di_credito.dataDiScadenza)
                                res.json({
                                    successful: {
                                        codice: 210,
                                        info: "I dati utente sono stati aggiornati correttamente."
                                    }
                                });
                            else
                                Carta.getCartaFromIdUtente(req.body.autista.id, function (err, rows) {
                                    if (err)
                                        res.status(400).json({
                                            error: {
                                                codice: 51,
                                                info: "Riscontrati problemi con il database, dati carta non aggiornati."
                                            }
                                        });
                                    else
                                        if (rows.length == 0)
                                            Carta.addCarta(req.body.autista, function (err) {
                                                if (err)
                                                    res.status(400).json({
                                                        error: {
                                                            codice: 51,
                                                            info: "Riscontrati problemi con il database, dati carta non aggiornati."
                                                        }
                                                    });
                                                else
                                                    res.json({
                                                        successful: {
                                                            codice: 210,
                                                            info: "I dati utente e della carta sono stati aggiornati correttamente."
                                                        }
                                                    });
                                            });
                                        else
                                            Carta.updateCarta(req.body.autista, function (err) {
                                                if (err)
                                                    res.status(400).json({
                                                        error: {
                                                            codice: 51,
                                                            info: "Riscontrati problemi con il database, dati carta non aggiornati."
                                                        }
                                                    });
                                                else
                                                    res.json({
                                                        successful: {
                                                            codice: 210,
                                                            info: "I dati utente e della carta sono stati aggiornati correttamente."
                                                        }
                                                    });
                                            });
                                });
                });
            else
                res.status(400).json({
                    error: {
                        codice: 500,
                        info: "Privilegi amministratore insufficienti."
                    }
                });
});

// Restituisci i parcheggi più vicini alle coordinate inviate tramite le API di GoogleMap
apiRoutes.post('/getParcheggiFromCoordinate', function (req, res) {
    if (req.body.lat == undefined || req.body.long == undefined)
        res.status(400).json({
            error: {
                codice: 7,
                info: "Devi specificare le tue coordinate."
            }
        });
    else
        Storage.getAllPostiLiberi(function (err, doc) {
            var posti = doc;

            // Prendo le coordinate dell' utente
            var coordinateRequest = {
                lat: req.body.lat,
                long: req.body.long
            };

            if (err)
                res.status(400).json({
                    error: {
                        codice: 7,
                        info: "Riscontrati problemi con i dati interni."
                    }
                });
            else
                Parcheggio.getAllParcheggi(function (err, rows) {
                    if (err)
                        res.status(400).json({
                            error: {
                                codice: 7,
                                info: "Riscontrati problemi con il database."
                            }
                        });
                    else
                        if (rows.length > 0) {
                            var parcheggi = [];
                            var l = 0;

                            for (var i = 0; i < rows.length; i++) {
                                var parcheggio = {
                                    id: rows[i].idParcheggio,
                                    indirizzo: {
                                        citta: rows[i].citta,
                                        provincia: rows[i].provincia,
                                        cap: rows[i].cap,
                                        via: rows[i].via,
                                        n_civico: rows[i].numero_civico
                                    },
                                    coordinate: {
                                        x: rows[i].coordinataX,
                                        y: rows[i].coordinataY
                                    },
                                    tariffaOrariaLavorativi: rows[i].tariffaOrariaLavorativi,
                                    tariffaOrariaFestivi: rows[i].tariffaOrariaFestivi,
                                    macBT: ConfigConnessione.mac
                                };

                                for (var k = 0; k < posti.length; k++)
                                    if (posti[k].id_parcheggio == parcheggio.id) {
                                        parcheggio.nPostiMacchina = posti[k].auto || 0;
                                        parcheggio.nPostiAutobus = posti[k].autobus || 0;
                                        parcheggio.nPostiCamper = posti[k].camper || 0;
                                        parcheggio.nPostiMoto = posti[k].moto || 0;
                                        parcheggio.nPostiDisabile = posti[k].disabile || 0;
                                    }

                                parcheggi[l] = parcheggio;
                                l++;
                            }

                            var destinazioni = "";
                            var l = 0;

                            for (var h = 0; h < parcheggi.length - 1; h++) {
                                destinazioni = destinazioni + (parcheggi[h].coordinate.x + "," + parcheggi[h].coordinate.y + "|");
                                l++;
                            }

                            destinazioni = destinazioni + (parcheggi[parcheggi.length - 1].coordinate.x + "," + parcheggi[parcheggi.length - 1].coordinate.y);

                            // Chiedo a google di clalcolarmi le distanze tra l'utente e tutti i parcheggi
                            DistastanceCalculator.sendDistanceRequest(coordinateRequest, destinazioni, function (error, response, bodyg) {
                                if (bodyg === undefined) {
                                    res.status(400).json({
                                        error: {
                                            codice: 7,
                                            info: "Le API di GoogleMaps non rispondono."
                                        }
                                    });
                                    console.log("Le API di GoogleMaps non rispondono.\n(KEY probabilmente scaduta)");
                                    return;
                                }

                                bodyg = JSON.parse(bodyg);
                                if (!error && response.statusCode == 200 && bodyg.rows != undefined) {
                                    if (bodyg.rows.length == 1) {
                                        // Potrei anche estrarre i primi N da qua 
                                        // (solo se google li restituisce in oridne di distanza)
                                        for (var c = 0; c < bodyg.rows[0].elements.length; c++) {
                                            if (bodyg.rows[0].elements[c].distance !== undefined && bodyg.rows[0].elements[c].duration !== undefined) {
                                                parcheggi[c].distanzaFisica = bodyg.rows[0].elements[c].distance.text;
                                                parcheggi[c].distanzaTemporale = bodyg.rows[0].elements[c].duration.text
                                                parcheggi[c].distance = bodyg.rows[0].elements[c].distance.value;
                                            }
                                            else {
                                                parcheggi[c].distanzaFisica = "error";
                                                parcheggi[c].distanzaTemporale = "error";
                                                parcheggi[c].distance = Number.MAX_SAFE_INTEGER;
                                            }
                                        }

                                        var l = 0;
                                        for (var c = 0; c < parcheggi.length - 1; c++)
                                            for (var k = c + 1; k < parcheggi.length; k++)
                                                if (parcheggi[c].distance > parcheggi[k].distance) {
                                                    var app = parcheggi[c];
                                                    parcheggi[c] = parcheggi[k];
                                                    parcheggi[k] = app;
                                                }

                                        var parResult = [];

                                        // Restituisco i 5 più vicini
                                        for (var c = 0; c < 5; c++)
                                            parResult[c] = parcheggi[c];

                                        res.json({
                                            parcheggi: parResult
                                        });
                                    }
                                    else
                                        res.status(400).json({
                                            error: {
                                                codice: 9,
                                                info: "Riscontrati problemi nella comunicazione con google. (output errato)"
                                            }
                                        });
                                }
                                else
                                    res.status(400).json({
                                        error: {
                                            codice: 9,
                                            info: "Riscontrati problemi nella comunicazione con google. (non risponde)"
                                        }
                                    });
                            });
                        }
                        else
                            res.status(400).json({
                                error: {
                                    codice: 7,
                                    info: "Non sono presenti parcheggi nel database."
                                }
                            });
                });
        });
});

apiRoutes.post('/getPostiLiberiParcheggio', function (req, res) {
    if (req.body.id == undefined)
        res.status(400).json({
            error: {
                codice: 7,
                info: "Devi specificare il parcheggio."
            }
        });
    else
        Storage.getAllPostiLiberi(function (err, doc) {
            if (err)
                res.status(400).json({
                    error: {
                        codice: 7,
                        info: "Riscontrati problemi con i dati interni."
                    }
                });
            else {
                var posti = null;

                for (var i = 0; i < doc.length; i++)
                    if (doc[i].id_parcheggio == req.body.id)
                        posti = {
                            nPostiMacchina: doc[i].auto || 0,
                            nPostiAutobus: doc[i].autobus || 0,
                            nPostiCamper: doc[i].camper || 0,
                            nPostiMoto: doc[i].moto || 0,
                            nPostiDisabile: doc[i].disabile || 0
                        };

                if (posti == null)
                    res.status(400).json({
                        error: {
                            codice: 67,
                            info: "Errore! Posti liberi non trovati per questo parcheggio."
                        }
                    });
                else
                    res.json({
                        postiLiberi: posti
                    });
            }
        });
});

apiRoutes.post('/effettuaPrenotazione', function (req, res) {
    if (req.body.idParcheggio == undefined || req.body.tipoParcheggio == undefined || req.body.tempoExtra == undefined)
        res.status(400).json({
            error: {
                codice: 77,
                info: "Dati mancanti per procedere con la richiesta."
            }
        });
    else
        Storage.getAllPostiLiberi(function (err, doc) {
            var posti = doc;

            if (err) {
                res.status(400).json({
                    error: {
                        codice: 7,
                        info: "Riscontrati problemi con i dati interni."
                    }
                });
            }
            else
                for (var k = 0; k < posti.length; k++) {
                    if (posti[k].id_parcheggio == req.body.idParcheggio) {
                        var disponibilita = 0;

                        switch (req.body.tipoParcheggio) {
                            case TipoPosto.auto:
                                disponibilita = posti[k].auto;
                                break;
                            case TipoPosto.autobus:
                                disponibilita = posti[k].autobus;
                                break;
                            case TipoPosto.camper:
                                disponibilita = posti[k].camper;
                                break;
                            case TipoPosto.moto:
                                disponibilita = posti[k].moto;
                                break;
                            case TipoPosto.disabile:
                                disponibilita = posti[k].disabile;
                                break;
                        }

                        if (disponibilita > 0) {
                            if (req.body.partenza == undefined || req.body.destinazione == undefined) {
                                // Genero il codice da cui creare il QRCode
                                var now = new Date();
                                var scadenza = new Date((now.getTime() + req.body.tempoExtra));
                                var data = now.getMilliseconds() + req.user.id;
                                var codice = crypto.createHash('md5').update(data.toString()).digest('hex') + req.user.id;

                                Prenotazione.addPrenotazione(req.user.id, req.body.idParcheggio, req.body.tipoParcheggio, scadenza, codice,
                                    function (err, result) {
                                        if (err) {
                                            res.status(400).json({
                                                error: {
                                                    codice: 98,
                                                    info: "Riscontrati errori con il database."
                                                }
                                            });
                                            return;
                                        }
                                        else {
                                            res.json({
                                                idPrenotazione: result.insertId,
                                                QR_Code: codice,
                                                scadenza: dateFormat(scadenza, "yyyy-mm-dd HH:MM:ss")
                                            });

                                            // Setto il timer per la cancellazione automatica alla scadenza della prenotaizone
                                            setTimeout(PrenotazioneScaduta, req.body.tempoExtra, result.insertId, req.user.id);

                                            // Aggiorno il numero di posti liberi
                                            switch (req.body.tipoParcheggio) {
                                                case TipoPosto.auto:
                                                    posti[k].auto--;
                                                    break;
                                                case TipoPosto.autobus:
                                                    posti[k].autobus--;
                                                    break;
                                                case TipoPosto.camper:
                                                    posti[k].camper--;
                                                    break;
                                                case TipoPosto.moto:
                                                    posti[k].moto--;
                                                    break;
                                                case TipoPosto.disabile:
                                                    posti[k].disabile--;
                                                    break;
                                            }

                                            Storage.updatePostiLiberi(posti, function (err) {
                                                if (err)
                                                    console.log("Attenzione!\nErrore nell' aggiornare il numero di posti liberi.");
                                            });
                                        }
                                    });
                            }
                            else {
                                var dest = req.body.destinazione.lat + "," + req.body.destinazione.long;
                                DistastanceCalculator.sendDistanceRequest(req.body.partenza, dest, function (error, response, bodyg) {
                                    if (bodyg === undefined) {
                                        res.status(400).json({
                                            error: {
                                                codice: 7,
                                                info: "Le API di GoogleMaps non rispondono."
                                            }
                                        });
                                        console.log("Le API di GoogleMaps non rispondono.\n(KEY probabilmente scaduta)");
                                        return;
                                    }

                                    bodyg = JSON.parse(bodyg);

                                    var tempoArrivo = -1;
                                    if (!error && response.statusCode == 200 && bodyg.rows != undefined) {
                                        if (bodyg.rows[0].elements[0].duration !== undefined)
                                            tempoArrivo = bodyg.rows[0].elements[0].duration.value * 1000; // google risponde in secondi
                                        else {
                                            res.status(400).json({
                                                error: {
                                                    codice: 198,
                                                    info: "Parcheggio probabilmente irraggiungibile in auto dalla tua posizione."
                                                }
                                            });
                                            return;
                                        }

                                        // Genero il codice da cui creare il QRCode
                                        var now = new Date();
                                        var scadenza = new Date((now.getTime() + req.body.tempoExtra + tempoArrivo));
                                        var data = now.getMilliseconds() + req.user.id;
                                        var codice = crypto.createHash('md5').update(data.toString()).digest('hex') + req.user.id;

                                        Prenotazione.addPrenotazione(req.user.id, req.body.idParcheggio, req.body.tipoParcheggio, scadenza, codice,
                                            function (err, result) {
                                                if (err) {
                                                    res.status(400).json({
                                                        error: {
                                                            codice: 98,
                                                            info: "Riscontrati errori con il database."
                                                        }
                                                    });
                                                    return;
                                                }
                                                else {
                                                    res.json({
                                                        idPrenotazione: result.insertId,
                                                        QR_Code: codice,
                                                        scadenza: dateFormat(scadenza, "yyyy-mm-dd HH:MM:ss")
                                                    });

                                                    // Setto il timer per la cancellazione automatica alla scadenza della prenotaizone
                                                    setTimeout(PrenotazioneScaduta, req.body.tempoExtra + tempoArrivo, result.insertId, req.user.id);

                                                    // Aggiorno il numero di posti liberi
                                                    switch (req.body.tipoParcheggio) {
                                                        case TipoPosto.auto:
                                                            posti[k].auto--;
                                                            break;
                                                        case TipoPosto.autobus:
                                                            posti[k].autobus--;
                                                            break;
                                                        case TipoPosto.camper:
                                                            posti[k].camper--;
                                                            break;
                                                        case TipoPosto.moto:
                                                            posti[k].moto--;
                                                            break;
                                                        case TipoPosto.disabile:
                                                            posti[k].disabile--;
                                                            break;
                                                    }

                                                    Storage.updatePostiLiberi(posti, function (err) {
                                                        if (err)
                                                            console.log("Attenzione!\nErrore nell' aggiornare il numero di posti liberi.");
                                                    });
                                                }
                                            });
                                    }
                                    else
                                        res.status(400).json({
                                            error: {
                                                codice: 9,
                                                info: "Riscontrati problemi nella comunicazione con google. (output errato)"
                                            }
                                        });
                                });
                            }
                        }
                        else {
                            res.status(400).json({
                                error: {
                                    codice: 88,
                                    info: "Non ci sono posti liberi per questo tipo di veicolo in questo parcheggio."
                                }
                            });
                        }
                        break;
                    }
                }
            if (k >= posti.length)
                res.status(400).json({
                    error: {
                        codice: 66,
                        info: "Errore! Parcheggio non trovato."
                    }
                });
        });
});

apiRoutes.delete('/deletePrenotazione', function (req, res) {
    if (req.body.idPrenotazione == undefined)
        res.status(400).json({
            error: {
                codice: 7,
                info: "Campi mancanti."
            }
        });
    else
        Prenotazione.getPrenotazioneUtente(req.user.id, req.body.idPrenotazione, function (err, rows) {
            if (err)
                res.status(400).json({
                    error: {
                        codice: 53,
                        info: "Riscontrati problemi con il database."
                    }
                });
            else
                if (rows.length == 1) {
                    var idParcheggio = rows[0].id_parcheggio;
                    var idTipoPosto = rows[0].id_tipo_posto;

                    Prenotazione.delPrenotazione(req.body.idPrenotazione, function (err) {
                        if (err) {
                            res.status(400).json({
                                error: {
                                    codice: 53,
                                    info: "Riscontrati problemi con il database."
                                }
                            });
                            return;
                        }
                        else {
                            res.json({
                                successful: {
                                    codice: 210,
                                    info: "La prenotazione è stata cancellata correttamente."
                                }
                            });

                            // Aggiorno il numero dei posti liberi
                            Storage.getAllPostiLiberi(function (err, data) {
                                if (err)
                                    console.log("Attenzione!\nErrore nell' aggiornare il numero di posti liberi (in lettura).");
                                else
                                    for (var i = 0; i < data.length; i++)
                                        if (data[i].id_parcheggio == idParcheggio) {
                                            switch (idTipoPosto) {
                                                case TipoPosto.auto:
                                                    data[i].auto++;
                                                    break;
                                                case TipoPosto.autobus:
                                                    data[i].autobus++;
                                                    break;
                                                case TipoPosto.camper:
                                                    data[i].camper++;
                                                    break;
                                                case TipoPosto.moto:
                                                    data[i].moto++;
                                                    break;
                                                case TipoPosto.disabile:
                                                    data[i].disabile++;
                                                    break;
                                            }
                                            Storage.updatePostiLiberi(data, function (err) {
                                                if (err)
                                                    console.log("Attenzione!\nErrore nell' aggiornare il numero di posti liberi (in scrittura).");
                                            });
                                            break;
                                        }
                            });
                        }
                    });
                }
                else
                    res.status(400).json({
                        error: {
                            codice: 40,
                            info: "Prenotazione non trovata tra quelle in atto nel tuo account."
                        }
                    });
        });
});

apiRoutes.patch('/resetQRCode', function (req, res) {
    if (req.body.idPrenotazione == undefined)
        res.status(400).json({
            error: {
                codice: 7,
                info: "Campi mancanti per l'aggiornamento del QRCODE della prenotazione."
            }
        });
    else
        if (req.user.livelloAmministrazione == undefined || req.user.livelloAmministrazione < 1)
            res.status(400).json({
                error: {
                    codice: 500,
                    info: "Privilegi amministratore insufficienti."
                }
            });
        else {
            var datetime = new Date();
            var data = datetime.getMilliseconds() + req.body.idPrenotazione;
            var codice = crypto.createHash('md5').update(data.toString()).digest('hex') + req.body.idPrenotazione;

            Prenotazione.updateQRCODE(req.body.idPrenotazione, codice, function (err) {
                if (err)
                    res.status(400).json({
                        error: {
                            codice: 53,
                            info: "Riscontrati problemi con il database."
                        }
                    });
                else
                    res.json({
                        QRCODE: codice,
                        successful: {
                            codice: 500,
                            info: "Il QRCode è stato rigenerato correttamente."
                        }
                    });
            });
        }
});

apiRoutes.post('/getPrenotazioniPagateUtente', function (req, res) {
    if (req.body.idUtente == undefined) {
        PrenotazionePagata.getPrenotazioniFromUtente(req.user.id, function (err, rows) {
            var prenotazioni = [];
            var prenotazionePagata;

            if (err)
                res.status(400).json({
                    error: {
                        codice: 53,
                        info: "Riscontrati problemi con il database."
                    }
                });
            else {
                var j = 0;

                for (var i = 0; i < rows.length; i++) {
                    prenotazionePagata = {
                        idPrenotazione: rows[i].idPrenotazione,
                        idUtente: rows[i].idUtente,
                        idParcheggio: rows[i].idParcheggio,
                        data: dateFormat(rows[i].dataPrenotazione, "yyyy-mm-dd HH:MM:ss"),
                        minutiPermanenza: rows[i].minutiPermanenza,
                        tipoParcheggio: rows[i].tipoParcheggio
                    };

                    prenotazioni[j] = prenotazionePagata;
                    j++;
                }

                res.json({
                    prenotazionePagata: prenotazioni
                });
            }
        });
    }
    else {
        if (req.user.livelloAmministrazione != undefined && req.user.livelloAmministrazione > 0) {
            PrenotazionePagata.getPrenotazioniFromUtente(req.body.idUtente, function (err, rows) {
                if (err)
                    res.status(400).json({
                        error: {
                            codice: 53,
                            info: "Riscontrati problemi con il database."
                        }
                    });
                else {
                    var j = 0;
                    for (var i = 0; i < rows.length; i++) {
                        prenotazionePagata = {
                            idPrenotazione: rows[i].idPrenotazione,
                            idUtente: rows[i].idUtente,
                            idParcheggio: rows[i].idParcheggio,
                            data: dateFormat(rows[i].dataPrenotazione, "yyyy-mm-dd HH:MM:ss"),
                            minutiPermanenza: rows[i].minutiPermanenza,
                            tipoParcheggio: rows[i].tipoParcheggio
                        };

                        prenotazioni[j] = prenotazionePagata;
                        j++;
                    }

                    res.json({
                        prenotazionePagata: prenotazioni
                    });
                }
            });
        }
        else {
            res.status(400).json({
                error: {
                    codice: 500,
                    info: "Privilegi amministratore insufficienti."
                }
            });
        }
    }

});

apiRoutes.post('/getPrenotazioniPagateParcheggio', function (req, res) {
    if (req.body.idParcheggio == undefined)
        res.status(400).json({
            error: {
                codice: 73,
                info: "Impossibile trovare le prenotazioni senza l'id del parcheggio."
            }
        });
    else
        if (req.user.livelloAmministrazione != undefined && req.user.livelloAmministrazione > 0) {
            PrenotazionePagata.getPrenotazioniFromParcheggio(req.body.idParcheggio, function (err, rows) {
                if (err)
                    res.status(400).json({
                        error: {
                            codice: 53,
                            info: "Riscontrati problemi con il database."
                        }
                    });
                else {
                    var prenotazioni = [];
                    var j = 0;
                    for (var i = 0; i < rows.length; i++) {
                        var orep = Math.floor(rows[i].minutiPermanenza / 60).toString();
                        if (rows[i].minutiPermanenza % 60 != 0)
                            orep = orep + ", " + (rows[i].minutiPermanenza % 60) + " minuti."

                        prenotazionePagata = {
                            idPrenotazione: rows[i].idPrenotazione,
                            idUtente: rows[i].idUtente,
                            idParcheggio: rows[i].idParcheggio,
                            data: dateFormat(rows[i].dataPrenotazione, "yyyy-mm-dd HH:MM:ss"),
                            orePermanenza: orep,
                            tipoParcheggio: rows[i].tipoParcheggio
                        };

                        prenotazioni[j] = prenotazionePagata;
                        j++;
                    }

                    res.json({
                        prenotazioniPagate: prenotazioni
                    });
                }
            });
        }
        else {
            res.status(400).json({
                error: {
                    codice: 500,
                    info: "Privilegi amministratore insufficienti."
                }
            });
        }
});

apiRoutes.post('/getPrenotazioniInAttoUtente', function (req, res) {
    if (req.body.idUtente == undefined) {
        Prenotazione.getPrenotazioniFromUtente(req.user.id, function (err, rows) {
            var prenotazioni = [];
            var prenotazione;

            if (err)
                res.status(400).json({
                    error: {
                        codice: 53,
                        info: "Riscontrati problemi con il database."
                    }
                });
            else {
                var j = 0;
                for (var i = 0; i < rows.length; i++) {
                    prenotazioneInAtto = {
                        idPrenotazione: rows[i].id_prenotazione,
                        idUtente: rows[i].id_utente,
                        idParcheggio: rows[i].id_parcheggio,
                        idPosto: rows[i].id_tipo_posto,
                        data: dateFormat(rows[i].data_scadenza, "yyyy-mm-dd HH:MM:ss"),
                        codice: rows[i].codice
                    };
                    prenotazioni[j] = prenotazioneInAtto;
                    j++;
                }

                res.json({
                    prenotazioniInAtto: prenotazioni
                });
            }
        });
    }
    else {
        if (req.user.livelloAmministrazione != undefined && req.user.livelloAmministrazione > 0) {
            Prenotazione.getPrenotazioniFromUtente(req.body.idUtente, function (err, rows) {
                if (err)
                    res.status(400).json({
                        error: {
                            codice: 53,
                            info: "Riscontrati problemi con il database."
                        }
                    });
                else {
                    var j = 0;
                    var prenotazioni = [];

                    for (var i = 0; i < rows.length; i++) {
                        prenotazioneInAtto = {
                            idPrenotazione: rows[i].id_prenotazione,
                            idUtente: rows[i].id_utente,
                            idParcheggio: rows[i].id_parcheggio,
                            idPosto: rows[i].id_tipo_posto,
                            data: dateFormat(rows[i].data_scadenza, "yyyy-mm-dd HH:MM:ss"),
                            codice: rows[i].codice
                        };

                        prenotazioni[j] = prenotazioneInAtto;
                        j++;
                    }

                    res.json({
                        prenotazioniInAtto: prenotazioni
                    });
                }
            });
        }
        else {
            res.status(400).json({
                error: {
                    codice: 500,
                    info: "Privilegi amministratore insufficienti."
                }
            });
        }
    }
});

apiRoutes.post('/getPrenotazioniDaPagare', function (req, res) {
    PrenotazionePagata.getPrenotazioniDaFinireFromUtente(req.user.id, function (err, rows) {
        if (err)
            res.status(400).json({
                error: {
                    codice: 53,
                    info: "Riscontrati problemi con il database."
                }
            });
        else {
            var prenotazioni = [];
            var j = 0;
            for (var i = 0; i < rows.length; i++) {
                var orep = Math.floor(rows[i].minutiPermanenza / 60).toString();
                if (rows[i].minutiPermanenza % 60 != 0)
                    orep = orep + ", " + (rows[i].minutiPermanenza % 60) + " minuti."

                prenotazioneDaPagare = {
                    idPrenotazione: rows[i].idPrenotazione,
                    idParcheggio: rows[i].idParcheggio,
                    dataIngresso: dateFormat(rows[i].dataPrenotazione, "yyyy-mm-dd HH:MM:ss"),
                    tipoParcheggio: rows[i].tipoParcheggio,
                    codice: rows[i].codice
                };

                prenotazioni[j] = prenotazioneDaPagare;
                j++;
            }

            res.json({
                prenotazioniDaPagare: prenotazioni
            });
        }
    });
});

apiRoutes.post('/addParcheggio', function (req, res) {
    if (req.body.parcheggio == undefined)
        res.status(400).json({
            error: {
                codice: 7,
                info: "Devi inviare i dati del parcheggio per aggiungerlo."
            }
        });
    else
        if (req.user.livelloAmministrazione != undefined && req.user.livelloAmministrazione > 0) {
            Parcheggio.addParcheggio(req.body.parcheggio, function (err, result) {
                if (err)
                    res.status(400).json({
                        error: {
                            codice: 350,
                            info: "Riscontrati problemi con il database."
                        }
                    });
                else {
                    var idPar = result.insertId;
                    Parcheggio.addPostiParcheggio(idPar, req.body.parcheggio, function (err, result) {
                        if (err) {
                            res.status(400).json({
                                error: {
                                    codice: 350,
                                    info: "Riscontrati problemi con il database."
                                }
                            });
                            Parcheggio.delParcheggio(idPar, function (err, result) {
                                if (err)
                                    console.log("Impossibile eliminare il parcheggio.\nATTENZIONE! Parcheggio aggiunto senza posti totali.");
                            });
                        }
                        else {
                            res.json({
                                id: idPar,
                                successful: {
                                    codice: 200,
                                    info: "Parcheggio aggiunto con successo."
                                }
                            });

                            var nuoviPostiLiberi = {
                                id_parcheggio: idPar,
                                auto: req.body.parcheggio.nPostiMacchina,
                                autobus: req.body.parcheggio.nPostiAutobus,
                                moto: req.body.parcheggio.nPostiMoto,
                                camper: req.body.parcheggio.nPostiCamper,
                                disabile: req.body.parcheggio.nPostiDisabile
                            }

                            Storage.getAllPostiLiberi(function (err, data) {
                                if (err)
                                    console.log("Attenzione!\nErrore nell' aggiornare il numero di posti liberi per il nuovo parcheggio (in lettura).");
                                else {
                                    data[data.length] = nuoviPostiLiberi;

                                    Storage.updatePostiLiberi(data, function (err) {
                                        if (err)
                                            console.log("Attenzione!\nErrore nell' aggiornare il numero di posti liberi per il nuovo parcheggio (in scrittura).");
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
        else
            res.status(400).json({
                error: {
                    codice: 500,
                    info: "Privilegi amministratore insufficienti."
                }
            });
});

apiRoutes.patch('/aggiornaParcheggio', function (req, res) {
    if (req.body.parcheggio == undefined)
        res.status(400).json({
            error: {
                codice: 7,
                info: "Devi inviare i dati del parcheggio per aggiungerlo."
            }
        });
    else
        if (req.user.livelloAmministrazione != undefined && req.user.livelloAmministrazione > 0) {
            Parcheggio.updateParcheggio(req.body.parcheggio, function (err, result) {
                if (err)
                    res.status(400).json({
                        error: {
                            codice: 350,
                            info: "Riscontrati problemi con il database."
                        }
                    });
                else {
                    if (req.body.parcheggio.nPostiMacchina == undefined)
                        res.json({
                            successful: {
                                codice: 180,
                                info: "Dati parcheggio modificati con successo."
                            }
                        });
                    else {
                        var error = 0;
                        Storage.getAllPostiLiberi(function (err, data) {
                            var index = -1;
                            var app = {
                                id_parcheggio: req.body.parcheggio.id
                            };

                            if (err)
                                console.log("Attenzione!\nErrore nell' aggiornare il numero di posti liberi (in lettura).");
                            else
                                for (index = 0; index < data.length; index++)
                                    if (data[index].id_parcheggio == req.body.parcheggio.id)
                                        break;

                            Parcheggio.updatePostiParcheggio(req.body.parcheggio.id, TipoPosto.auto, req.body.parcheggio.nPostiMacchina, function (err) {
                                if (err)
                                    error++;
                                else
                                    app.auto = req.body.parcheggio.nPostiMacchina;
                                Parcheggio.updatePostiParcheggio(req.body.parcheggio.id, TipoPosto.moto, req.body.parcheggio.nPostiMoto, function (err) {
                                    if (err)
                                        error++;
                                    else
                                        app.moto = req.body.parcheggio.nPostiMoto;
                                    Parcheggio.updatePostiParcheggio(req.body.parcheggio.id, TipoPosto.camper, req.body.parcheggio.nPostiCamper, function (err) {
                                        if (err)
                                            error++;
                                        else
                                            app.camper = req.body.parcheggio.nPostiCamper;
                                        Parcheggio.updatePostiParcheggio(req.body.parcheggio.id, TipoPosto.autobus, req.body.parcheggio.nPostiAutobus, function (err) {
                                            if (err)
                                                error++;
                                            else
                                                app.autobus = req.body.parcheggio.nPostiAutobus;
                                            Parcheggio.updatePostiParcheggio(req.body.parcheggio.id, TipoPosto.disabile, req.body.parcheggio.nPostiDisabile, function (err) {
                                                if (err)
                                                    error++;
                                                else
                                                    app.disabile = req.body.parcheggio.nPostiDisabile;
                                                if (error == 0)
                                                    res.json({
                                                        successful: {
                                                            codice: 185,
                                                            info: "Dati parcheggio e numero posti aggiornati."
                                                        }
                                                    });
                                                else
                                                    res.json({
                                                        successful: {
                                                            codice: 187,
                                                            info: "Dati parcheggio aggiornati, " + error + " numeri posti totali parzialmente aggiornati.\n(riscontrati problemi con il database)"
                                                        }
                                                    });

                                                if (index != -1) {
                                                    data[index] = app;

                                                    Storage.updatePostiLiberi(data, function (err) {
                                                        if (err)
                                                            console.log("Attenzione!\nErrore nell' aggiornare il numero di posti liberi (in scrittura).");
                                                    });
                                                }
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    }
                }
            });
        }
        else
            res.status(400).json({
                error: {
                    codice: 500,
                    info: "Privilegi amministratore insufficienti."
                }
            });
});

apiRoutes.delete('/deleteParcheggio', function (req, res) {
    if (req.body.id == undefined)
        res.status(400).json({
            error: {
                codice: 7,
                info: "Devi specificare l'id del parcheggio per eliminarlo."
            }
        });
    else
        if (req.user.livelloAmministrazione != undefined && req.user.livelloAmministrazione > 0) {
            Parcheggio.delParcheggio(req.body.id, function (err, result) {
                if (err) {
                    res.status(400).json({
                        error: {
                            codice: 375,
                            info: "Impossibile eliminare il parcheggio, (probabilmente sono presenti prenotazioni in corso in esso)."
                        }
                    });
                }
                else {
                    res.json({
                        successful: {
                            codice: 200,
                            info: "Parcheggio eliminato con successo."
                        }
                    });

                    Storage.getAllPostiLiberi(function (err, data) {
                        if (err)
                            console.log("Attenzione!\nErrore nell' aggiornare il numero di posti liberi per il parcheggio eliminato (in lettura).");
                        else {
                            var i;
                            for (i = 0; i < data.length; i++)
                                if (req.body.id == data[i].id_parcheggio)
                                    break;

                            for (var j = i; j < data.length - 1; j++)
                                data[j] = data[j + 1];

                            data[data.length] = null;
                            data.length--;

                            Storage.updatePostiLiberi(data, function (err) {
                                if (err)
                                    console.log("Attenzione!\nErrore nell' aggiornare il numero di posti liberi per il parcheggio eliminato (in scrittura).");
                            });
                        }
                    });
                }
            });
        }
        else
            res.status(400).json({
                error: {
                    codice: 500,
                    info: "Privilegi amministratore insufficienti."
                }
            });
});

module.exports = apiRoutes;