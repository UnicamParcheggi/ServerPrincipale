var db = require("../mysql/DB_Connection");

var verificaEmail = {
    addEmailCode: function (idAutista, codice, callback) {
        return db.query("INSERT INTO verifica_email (`id_utente`, `codice`) VALUES (?,?);", [idAutista, codice], callback);
    },
    getEmailCode: function (codice, callback) {
        return db.query("SELECT * FROM verifica_email WHERE codice=?;", [codice], callback);
    },
    delEmailCode: function (idAutista, callback) {
        return db.query("DELETE FROM verifica_email WHERE id_utente=?;", [idAutista], callback);
    }
};

module.exports = verificaEmail;