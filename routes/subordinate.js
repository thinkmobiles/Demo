'use strict';

var express = require('express');
var router = express.Router();
var SessionHandler = require('../handlers/sessions');
var SubordinateHandler = require('../handlers/subordinate');

module.exports = function (db) {

    var session = new SessionHandler(db);
    var handler = new SubordinateHandler(db);

    router.delete('/:id', session.isAuthenticatedAdmin, handler.remove);
    router.get('/', session.isAuthenticatedAdmin, handler.subordinates);
    router.post('/', session.isAuthenticatedAdmin, handler.createSubordinate);
    router.patch('/:id', session.isAuthenticatedAdmin, handler.update);



    return router;
};


