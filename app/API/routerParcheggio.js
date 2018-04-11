var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');
var express = require('express');
var crypto = require('crypto');
var dateFormat = require('dateformat');

// Modelli
var Prenotazione = require("../models/prenotazione");
var PrenotazionePagata = require("../models/prenotazionePagata");
var Parcheggio = require("../models/parcheggio");

// Localstorage interno per salvare il numero dei posti liberi (senza doverlo ricalcolare da mysql ad ogni richiesta)
var Storage = require('../storage/Storage');

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
                        info: "Riscontrati problemi nell' autenticare il token de parcheggio."
                    }
                });
            else {
                req.parcheggio = decoded;
                next();
            }
        });
    } else {
        return res.status(400).json({
            error: {
                codice: 15,
                info: "Devi essere loggato come parcheggio riconosciuto per eseguire quest' azione."
            }
        });
    }
};

// API ROUTES -------------------
var apiRoutes = express.Router();

// use body parser so we can get info from POST and/or URL parameters
apiRoutes.use(bodyParser.urlencoded({ extended: false }));
apiRoutes.use(bodyParser.json());

apiRoutes.post('/auth', function (req, res) {
    console.log("Authentication request from parking: " + req.ip);
    if (req.body.id == undefined || req.body.key == undefined)
        res.status(400).json({
            error: {
                codice: 7,
                info: "Campi mancanti."
            }
        });
    else {
        Parcheggio.loginParcheggio(req.body.id, req.body.key, function (err, rows) {
            if (err)
                res.status(400).json({
                    error: {
                        codice: 50,
                        info: "Riscontrati problemi con il database."
                    }
                });
            else {
                if (rows.length == 1) {
                    var parcheggio = {
                        id: rows[0].idParcheggio,
                        indirizzo: {
                            citta: rows[0].citta,
                            provincia: rows[0].provincia,
                            cap: rows[0].cap,
                            via: rows[0].via,
                            n_civico: rows[0].numero_civico
                        },
                        tariffaOrariaLavorativi: rows[0].tariffaOrariaLavorativi,
                        tariffaOrariaFestivi: rows[0].tariffaOrariaFestivi
                    };

                    res.json({
                        token: jwt.sign(parcheggio, ConfigConnessione.secret),
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
            }
        });
    }
});

//  #### da qui in poi è necessaria l'autenticazione via token del parcheggio ####
apiRoutes.use(verifyToken);

// Route per il server nel parcheggio
apiRoutes.post('/entrataAutomobilista', function (req, res) {
    if (req.body.QRCODE == undefined) {
        res.status(400).json({
            error: {
                codice: 7,
                info: "Campi mancanti."
            }
        });
        return;
    }

    Prenotazione.getPrenotazioneFromCodice(req.parcheggio.id, req.body.QRCODE, function (err, rows) {
        if (err) {
            res.status(400).json({
                error: {
                    codice: 78,
                    info: "Riscontrati problemi con il database."
                }
            });
            return;
        }

        if (rows.length > 0) {
            PrenotazionePagata.addPrenotazioneDaPagare(rows[0].id_utente, rows[0].id_parcheggio,
                rows[0].id_tipo_posto, req.body.QRCODE, function (err, result) {
                    if (err)
                        res.status(400).json({
                            error: {
                                codice: 78,
                                info: "Riscontrati problemi con il database."
                            }
                        });
                    else {
                        res.json({
                            id: result.insertId,
                            successful: {
                                codice: 250,
                                info: "Sei abilitato ad entrare nel parcheggio."
                            }
                        });

                        Prenotazione.delPrenotazione(rows[0].id_prenotazione, function (err, result) {
                            if (err)
                                console.log("ATTENZIONE!\nPrenotazione da pagare aggiunta ma impossibile cancellarla da quelle in atto.");
                            else
                                console.log("Un codice è stato utilizzato per entrare nel parcheggio (id: " + req.parcheggio.id + ").\nPrenotazione da pagare aggiunta.");
                        });
                    }
                });
        }
        else
            res.status(400).json({
                error: {
                    codice: 68,
                    info: "Codice prenotazione errato o di un altro parcheggio."
                }
            });
    });
});

apiRoutes.post('/uscitaAutomobilista', function (req, res) {
    if (req.body.QRCODE == undefined) {
        res.status(400).json({
            error: {
                codice: 7,
                info: "Campi mancanti."
            }
        });
        return;
    }

    PrenotazionePagata.getPrenotazioneDaFinireFromCodice(req.parcheggio.id, req.body.QRCODE, function (err, rows) {
        if (err)
            res.status(400).json({
                error: {
                    codice: 78,
                    info: "Riscontrati problemi con il database."
                }
            });
        else {
            if (rows.length > 0) {
                var minutiP = ((new Date().getTime() - rows[0].dataPrenotazione) / 60000);
                var idTipo = rows[0].tipoParcheggio;
                PrenotazionePagata.pagaPrenotazineDaFinire(rows[0].idPrenotazione, minutiP, function (err, result) {
                    if (err)
                        res.status(400).json({
                            error: {
                                codice: 78,
                                info: "Riscontrati problemi con il database."
                            }
                        });
                    else {
                        res.json({
                            minuti: minutiP,
                            successful: {
                                codice: 250,
                                info: "Sei abilitato ad uscire."
                            }
                        });
                        console.log("Un codice è stato utilizzato per uscire dal parcheggio (id: " + req.parcheggio.id + ").\nPrenotazione pagata e salvata con successo.");

                        // Aggiorno il numero dei posti liberi
                        Storage.getAllPostiLiberi(function (err, data) {
                            if (err)
                                console.log("Attenzione!\nErrore nell' aggiornare il numero di posti liberi (in lettura).");
                            else
                                for (var i = 0; i < data.length; i++)
                                    if (data[i].id_parcheggio == req.parcheggio.id) {
                                        switch (idTipo) {
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
                        codice: 68,
                        info: "Codice prenotazione errato."
                    }
                });
        }
    });
});

module.exports = apiRoutes;