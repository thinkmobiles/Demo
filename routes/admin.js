'use strict';

var express = require('express');
var router = express.Router();
var SessionHandler = require('../handlers/sessions');
var AnalyticHandler = require('../handlers/admin');

module.exports = function (db) {

    var handler = new AnalyticHandler(db);
    var session = new SessionHandler(db);
    router.get('/confirm', handler.confirmUser);

    return router;
};


