var db = require("../mysql/DB_Connection");
var dateFormat = require('dateformat');

var prenotazioniPagate = {
    addPrenotazioneDaPagare: function (idUtente, idParcheggio, tipoPosto, codice, callback) {
        return db.query("INSERT INTO prenotazioni_pagate (idUtente, idParcheggio, dataPrenotazione, minutiPermanenza, tipoParcheggio, codice) VALUES (?,?,?,-1,?,?);", [idUtente, idParcheggio, dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), tipoPosto, codice], callback);
    },
    getPrenotazioniFromUtente: function (idUtente, callback) {
        return db.query("SELECT * FROM prenotazioni_pagate WHERE idUtente=? AND minutiPermanenza>=0;", [idUtente], callback);
    },
    getPrenotazioniDaFinireFromUtente: function (idUtente, callback) {
        return db.query("SELECT * FROM prenotazioni_pagate WHERE idUtente=? AND minutiPermanenza<0;", [idUtente], callback);
    },
    getPrenotazioneDaFinireFromCodice: function (id, codice, callback) {
        return db.query("SELECT * FROM prenotazioni_pagate WHERE `idParcheggio`=? AND `codice`=? AND minutiPermanenza<0;", [id, codice], callback);
    },
    getPrenotazioniFromParcheggio: function (idParcheggio, callback) {
        return db.query("SELECT * FROM prenotazioni_pagate WHERE idParcheggio=? AND minutiPermanenza>=0 ORDER BY dataPrenotazione DESC LIMIT 10;", [idParcheggio], callback);
    },
    pagaPrenotazineDaFinire: function (idPrenotazione, minutiPermanenza, callback) {
        return db.query("UPDATE prenotazioni_pagate SET minutiPermanenza=?, codice=null WHERE idPrenotazione=?;", [minutiPermanenza, idPrenotazione], callback);
    }
};

module.exports = prenotazioniPagate;

/*
var prenotazioniPagate = {
    idPrenotazione: Number,
    idUtente: Number,
    idParcheggio: Number,
    data: Date,
    orePermanenza: Number,
    tipoParcheggio: TipoParcheggio
};
*/