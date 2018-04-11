var http = require('http');
var express = require('express');
var routerUsers = require('./app/API/routerUsers');
var routerPark = require('./app/API/routerParcheggio');
var ConfigConnessione = require("./app/config/configConnessione");

var app = express();

app.use(function allowCrossDomain(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    if ('OPTIONS' === req.method)
        res.sendStatus(200);
    else
        next();
});

//  Imposto le API Routes nella path principale del server
app.use('/parcheggio/', routerPark);
app.use('/', routerUsers);

var httpServer = http.createServer(app);

httpServer.listen(ConfigConnessione.portInternal, ConfigConnessione.ipInternal, function () {
        console.log("\nServer in ascolto su: " + ConfigConnessione.ipInternal + ":" + ConfigConnessione.portInternal);
});