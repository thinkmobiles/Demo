'use strict';

var express = require('express');
var router = express.Router();
var SessionHandler = require('../handlers/sessions');
var AnalyticHandler = require('../handlers/admin');

module.exports = function (db) {

    var handler = new AnalyticHandler(db);
    var session = new SessionHandler(db);
    router.get('/confirm', handler.confirmUser);
    router.get('/users/pending', session.isAuthenticatedAdmin, handler.pendingUsers);
    router.get('/users/confirmed', session.isAuthenticatedAdmin, handler.confirmedUsers);
    router.post('/changePass', session.isAuthenticatedAdmin, handler.changePass);
    router.delete('/user', session.isAuthenticatedAdmin, handler.remove);


    return router;
};


