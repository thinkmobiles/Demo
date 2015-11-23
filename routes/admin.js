'use strict';

var express = require('express');
var router = express.Router();
var SessionHandler = require('../handlers/sessions');
var AnalyticHandler = require('../handlers/admin');

module.exports = function (db) {

    var handler = new AnalyticHandler(db);
    var session = new SessionHandler(db);
    router.post('/confirm', handler.confirmUser);
    router.patch('/users/:id', handler.update);

    router.delete('/users/:id', session.isAuthenticatedSuperAdmin, handler.remove);
    router.get('/users/pending', session.isAuthenticatedSuperAdmin, handler.pendingUsers);
    router.get('/users/confirmed', session.isAuthenticatedSuperAdmin, handler.confirmedUsers);
    router.post('/changePass', session.isAuthenticatedSuperAdmin, handler.changePass);




    return router;
};


