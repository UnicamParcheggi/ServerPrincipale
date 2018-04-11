var mysql = require('mysql');
var config = require('../config/configMysqlDB');

var connection = mysql.createPool(config);

module.exports = connection;