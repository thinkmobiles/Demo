'use strict';

var express = require('express');
var router = express.Router();
var SessionHandler = require('../handlers/sessions');
var AnalyticHandler = require('../handlers/admin');

module.exports = function (db) {

    var handler = new AnalyticHandler(db);
    var session = new SessionHandler(db);
    router.post('/users/confirm', handler.confirmUser);

    router.put('/users/:id', handler.update);
    router.delete('/users/:id', session.isAuthenticatedAdmin, handler.remove);
    router.get('/users/pending', session.isAuthenticatedAdmin, handler.pendingUsers);
    router.get('/users/confirmed', session.isAuthenticatedAdmin, handler.confirmedUsers);
    router.post('/changePass', session.isAuthenticatedAdmin, handler.changePass);


    return router;
};


