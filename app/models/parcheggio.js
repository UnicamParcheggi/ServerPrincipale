var db = require("../mysql/DB_Connection");

var parcheggio = {
    getAllParcheggi: function (callback) {
        return db.query("SELECT * FROM parcheggi;", callback);
    },
    getParcheggiConPostiTotali: function (callback) {
        return db.query("SELECT * FROM parcheggi, posti_parcheggio  WHERE idParcheggio = id_parcheggio ORDER BY id_parcheggio, id_tipo;", callback);
    },
    getAllPostiLiberi: function (callback) {
        return db.query("SELECT * FROM posti_parcheggio_liberi_view;", callback);
    },
    getParcheggioFromID: function (id, callback) {
        return db.query("SELECT * FROM parcheggi WHERE idParcheggio=?;", [id], callback);
    },
    addParcheggio: function (parcheggio, callback) {
        return db.query("INSERT INTO parcheggi (`coordinataX`, `coordinataY`, `citta`, `cap`, `via`, `numero_civico`, `tariffaOrariaLavorativi`, `tariffaOrariaFestivi`, `provincia`, `key`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", [parcheggio.coordinate.x, parcheggio.coordinate.y, parcheggio.indirizzo.citta, parcheggio.indirizzo.cap, parcheggio.indirizzo.via, parcheggio.indirizzo.n_civico, parcheggio.tariffaOrariaLavorativi, parcheggio.tariffaOrariaFestivi, parcheggio.indirizzo.provincia, parcheggio.key], callback);
    },
    addPostiParcheggio: function(idParcheggio, posti, callback) {
        return db.query("INSERT INTO posti_parcheggio (id_parcheggio, id_tipo, numero_posti) VALUES (?, 0, ?), (?, 1, ?), (?, 2, ?), (?, 3, ?), (?, 4, ?)", [idParcheggio, posti.nPostiMacchina, idParcheggio, posti.nPostiCamper, idParcheggio, posti.nPostiMoto, idParcheggio, posti.nPostiAutobus, idParcheggio, posti.nPostiDisabile], callback);
    },
    delParcheggio: function(idParcheggio, callback) {
        db.query("DELETE FROM parcheggi WHERE idParcheggio=?;", [idParcheggio], callback);
    },
    updateParcheggio: function(parcheggio, callback) {
        db.query("UPDATE parcheggi SET `coordinataX`=?, `coordinataY`=?, `citta`=?, `cap`=?, `via`=?, `numero_civico`=?, `tariffaOrariaLavorativi`=?, `tariffaOrariaFestivi`=?, `provincia`=?, `key`=? WHERE `idParcheggio`=?;", [parcheggio.coordinate.x, parcheggio.coordinate.y, parcheggio.indirizzo.citta, parcheggio.indirizzo.cap, parcheggio.indirizzo.via, parcheggio.indirizzo.n_civico, parcheggio.tariffaOrariaLavorativi, parcheggio.tariffaOrariaFestivi, parcheggio.indirizzo.provincia, parcheggio.key, parcheggio.id], callback);
    },
    updatePostiParcheggio: function(idParcheggio, idTipo, posti, callback) {
        return db.query("UPDATE posti_parcheggio SET `numero_posti`=?  WHERE `id_parcheggio`=? AND `id_tipo`=?;", [posti, idParcheggio, idTipo], callback);
    },
    loginParcheggio: function (id, key, callback) {
        return db.query("SELECT * FROM parcheggi WHERE `idParcheggio`=? and `key`=?;", [id, key], callback);
    }
};

module.exports = parcheggio;