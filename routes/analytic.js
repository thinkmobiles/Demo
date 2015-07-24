'use strict';

var express = require('express');
var router = express.Router();
var SessionHandler = require('../handlers/sessions');
var AnalyticHandler = require('../handlers/analytic');

module.exports = function (db) {

    var handler = new AnalyticHandler(db);
    var session = new SessionHandler(db);
    router.get('/question', session.isAuthenticated, handler.question);
    router.get('/document', session.isAuthenticated, handler.document);
    router.get('/video', session.isAuthenticated, handler.video);
    router.get('/visits', session.isAuthenticated, handler.visits);

    router.get('/totalVisits', session.isAuthenticated, handler.totalVisits);

    router.get('/allDomain', session.isAuthenticated, handler.allDomain);
    router.get('/contactsByDomain', session.isAuthenticated, handler.contactsByDomain);
    router.get('/contactMe', session.isAuthenticated, handler.contactMe);
    router.get('/contacts', session.isAuthenticated, handler.contacts);
    router.get('/contact', session.isAuthenticated, handler.contact);

    return router;
};


