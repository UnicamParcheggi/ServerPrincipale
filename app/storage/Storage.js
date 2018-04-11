var storage = require('node-persist');
var TipoPosto = require('../config/configTipoPosto');

storage.init({
    dir: './app/storage/data',
    stringify: JSON.stringify,
    parse: JSON.parse,
    encoding: 'utf8',
    logging: false,
    continuous: false,
    interval: false,
    ttl: false,
    expiredInterval: 2 * 60 * 1000,
    forgiveParseErrors: false
}).then(function () {
    console.log("Local storage inizializzato.");
}, function (err) {
    console.log("Errore! local storage non inizializzato.");
});

var funzionalita = {
    loadPostiLiberiFromServer: function (callback) {
        var Parcheggio = require("../models/parcheggio");
        // Elimino i dati precedenti
        storage.removeItem('PostiLiberi', function (err) {
            if (err)
                throw err; 
        });
        var posti = [];
        // Carico il numero di tutti i posti liberi di ogni parcheggio in memoria da mysql
        Parcheggio.getAllPostiLiberi(function (err, rows) {
            if (err) {
                console.log(err);
                throw err;
            }
            else { // Funziona solo se vengono restituiti ordinati per id parcheggio (la view dei posti liberi è ordinata così)
                var k = 0;
                var id = -1;
                var posto;
                for (var i = 0; i < rows.length; i++) {
                    {
                        if (rows[i].id_parcheggio != id) {
                            if (id >= 0) {
                                posti[k] = posto;
                                k++;
                            }
                            posto = { id_parcheggio: rows[i].id_parcheggio };
                            id = rows[i].id_parcheggio;
                        }

                        switch (rows[i].id_tipo) {
                            case TipoPosto.auto:
                                posto.auto = rows[i].postiLiberi;
                                break;
                            case TipoPosto.autobus:
                                posto.autobus = rows[i].postiLiberi;
                                break;
                            case TipoPosto.camper:
                                posto.camper = rows[i].postiLiberi;
                                break;
                            case TipoPosto.moto:
                                posto.moto = rows[i].postiLiberi;
                                break;
                            case TipoPosto.disabile:
                                posto.disabile = rows[i].postiLiberi;
                                break;
                            default:
                                console.log("Si è verificato un errore durante il caricamento dei posti liberi.\n(id del tipo posto sconosciuto)");
                                break;
                        }
                    }
                }
                posti[k] = posto;
                k++;

                storage.setItem("PostiLiberi", posti);
                console.log("Numero posti liberi caricati in memoria dal database.");
                callback();
            }
        });
    },
    getAllPostiLiberi: function (callback) {
        return storage.getItem('PostiLiberi', callback);
    },
    updatePostiLiberi: function (posti, callback) {
        return storage.setItem("PostiLiberi", posti);
    }
};

module.exports = funzionalita;

/**
 * Formato posti liberi
 * PostiLiberi = {[
 *  id_parcheggio: 1,
 *  auto: 80,
 *  autobus: 90,
 *  moto: 87,
 *  camper: 70,
 *  disabile: 50
 * ]}
 */