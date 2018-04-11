var db = require("../mysql/DB_Connection");
var dateFormat = require('dateformat');

var utente = {
    addAutista: function (autista, callback) {
        return db.query("INSERT INTO utenti (`username`, `password`, `email`, `nome`, `cognome`, `dataDiNascita`, `telefono`, `saldo`) VALUES (?,?,?,?,?,?,?,?);", [autista.username, autista.password, autista.email, autista.nome, autista.cognome, dateFormat(autista.dataDiNascita, "yyyy-mm-dd"), autista.telefono, 0], callback);
    },
    getAutistaFromUsername: function (username, password, callback) {
        return db.query("SELECT * FROM autisti_view WHERE username=? AND password=?;", [username, password], callback);
    },
    getAutistaFromEmail: function (email, password, callback) {
        return db.query("SELECT * FROM autisti_view WHERE email=? AND password=?; ", [email, password], callback);
    },
    getAdmin: function (username, password, callback) {
        return db.query("SELECT * FROM admin_view WHERE username=? AND password=?;", [username, password], callback);
    },
    delAutista: function (id, callback) {
        return db.query("DELETE FROM utenti WHERE idUtente=?;", [id], callback);
    },
    updateAutista: function (autista, callback) {
        return db.query("UPDATE utenti SET `username`=?, `password`=?, `email`=?, `nome`=?, `cognome`=?, `dataDiNascita`=?, `telefono`=?, `saldo`=?, `abilitato`=?  WHERE idUtente=?;", [autista.username, autista.password, autista.email, autista.nome, autista.cognome, dateFormat(autista.dataDiNascita, "yyyy-mm-dd"), autista.telefono, autista.saldo, autista.abilitato, autista.id], callback);
    },
    setAbilitazioneAutista: function (idUtente, abilitazione, callback) {
        return db.query("UPDATE utenti SET `abilitato`=? WHERE idUtente=?;", [abilitazione, idUtente], callback);
    },
    getAllAutisti: function (callback) {
        return db.query("SELECT `utenti`.`idUtente` AS `idUtente`, `utenti`.`username` AS `username`, `utenti`.`password` AS `password`, `utenti`.`email` AS `email`, `utenti`.`nome` AS `nome`, `utenti`.`cognome` AS `cognome`, `utenti`.`dataDiNascita` AS `dataDiNascita`, `utenti`.`telefono` AS `telefono`, `utenti`.`saldo` AS `saldo`, `utenti`.`abilitato` as `abilitato`, `carte_di_credito`.`numeroCarta` AS `numeroCarta`, `carte_di_credito`.`dataDiScadenza` AS `dataDiScadenza`, `carte_di_credito`.`pinDiVerifica` AS `pinDiVerifica` FROM (`utenti` LEFT JOIN `carte_di_credito` ON ((`utenti`.`idUtente` = `carte_di_credito`.`idUtente`))) ORDER BY idUtente DESC;", callback);
    },
    getAutistaFromOnlyEmail: function (email, callback) {
        return db.query("SELECT * FROM autisti_view WHERE email=?; ", [email], callback);
    },
    CorreggiAutista: function (nuovo, vecchio, callback) { //  Correzione campi dati vuoti per update
        var result = {
            id: vecchio.id,
            username: nuovo.username || vecchio.username,
            password: nuovo.password || vecchio.password,
            email: nuovo.email || vecchio.email,
            nome: nuovo.nome || vecchio.nome,
            cognome: nuovo.cognome || vecchio.cognome,
            dataDiNascita: nuovo.dataDiNascita || vecchio.dataDiNascita,
            telefono: nuovo.telefono || vecchio.telefono,
            saldo: nuovo.saldo || vecchio.saldo,
            abilitato: 1
        }

        if (nuovo.carta_di_credito == undefined)
            if (vecchio.carta_di_credito == undefined)
                return result;
            else
                if (vecchio.carta_di_credito.numero_carta == undefined || vecchio.carta_di_credito.pin == undefined || vecchio.carta_di_credito.dataDiScadenza == undefined)
                    return result;
                else
                    result.carta_di_credito = {
                        numero_carta: vecchio.carta_di_credito.numero_carta,
                        pin: vecchio.carta_di_credito.pin,
                        dataDiScadenza: vecchio.carta_di_credito.dataDiScadenza
                    };
        else
            if (vecchio.carta_di_credito == undefined)
                if (nuovo.carta_di_credito.numero_carta == undefined || nuovo.carta_di_credito.pin == undefined || nuovo.carta_di_credito.dataDiScadenza == undefined)
                    return result;
                else
                    result.carta_di_credito = {
                        numero_carta: nuovo.carta_di_credito.numero_carta,
                        pin: nuovo.carta_di_credito.pin,
                        dataDiScadenza: nuovo.carta_di_credito.dataDiScadenza
                    };
            else
                if (vecchio.carta_di_credito.numero_carta == undefined || vecchio.carta_di_credito.pin == undefined || vecchio.carta_di_credito.dataDiScadenza == undefined)
                    result.carta_di_credito = {
                        numero_carta: nuovo.carta_di_credito.numero_carta,
                        pin: nuovo.carta_di_credito.pin,
                        dataDiScadenza: nuovo.carta_di_credito.dataDiScadenza
                    };
                else
                    result.carta_di_credito = {
                        numero_carta: nuovo.carta_di_credito.numero_carta || vecchio.carta_di_credito.numero_carta,
                        pin: nuovo.carta_di_credito.pin || vecchio.carta_di_credito.pin,
                        dataDiScadenza: nuovo.carta_di_credito.dataDiScadenza || vecchio.carta_di_credito.dataDiScadenza
                    };
        callback(result);
    }
};

module.exports = utente;