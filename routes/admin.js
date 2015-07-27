'use strict';

var express = require('express');
var router = express.Router();
var SessionHandler = require('../handlers/sessions');
var AnalyticHandler = require('../handlers/admin');

module.exports = function (db) {

    var handler = new AnalyticHandler(db);
    var session = new SessionHandler(db);
    router.get('/confirm', handler.confirmUser);
    router.get('/users', session.isAuthenticatedAdmin, handler.users);
    router.post('/changePass', session.isAuthenticatedAdmin, handler.changePass);
    router.delete('/user', session.isAuthenticatedAdmin, handler.remove);


    return router;
};


