var request = require('request');
var config = require('./config/configGoogleAPI');

var distanceCalculator = {
    sendDistanceRequest: function (coordinate, destinationi, callback) {
        var URL = config.path + config.outputFormat + "?" + config.parametri + 
        "&origins=" + coordinate.lat + "," + coordinate.long + 
        "&destinations="+ destinationi + 
        "&key=" + config.key;

        request.get({
            url: URL,
            callback
        });
    }
};

module.exports = distanceCalculator;

