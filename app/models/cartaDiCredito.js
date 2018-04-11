var db = require("../mysql/DB_Connection");
var dateFormat = require('dateformat');

var cartaDiCredito = {
    addCarta: function (autista, callback) {
        return db.query("INSERT INTO carte_di_credito (`idUtente`, `numeroCarta`, `dataDiScadenza`, `pinDiVerifica`) VALUES (?,?,?,?);", [autista.id, autista.carta_di_credito.numero_carta, dateFormat(autista.carta_di_credito.dataDiScadenza, "yyyy-mm-dd"), autista.carta_di_credito.pin], callback);
    },
    getCartaFromIdUtente: function (id, callback) {
        return db.query("SELECT * FROM carte_di_credito WHERE idUtente=?;", [id], callback);
    },
    updateCarta: function (autista, callback) {
        return db.query("UPDATE carte_di_credito SET `numeroCarta`=?, `dataDiScadenza`=?, `pinDiVerifica`=? where idUtente=?;", [autista.carta_di_credito.numero_carta, dateFormat(autista.carta_di_credito.dataDiScadenza, "yyyy-mm-dd"), autista.carta_di_credito.pin, autista.id], callback);
    }
};

module.exports = cartaDiCredito;