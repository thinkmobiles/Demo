'use strict';

var express = require('express');
var router = express.Router();
var ContentHandler = require('../handlers/content');
var multipart = require( 'connect-multiparty' )();
var SessionHandler = require('../handlers/sessions');

module.exports = function (db) {

    var handler = new ContentHandler(db);
    var session = new SessionHandler(db);




    router.get('/list', session.isAuthenticatedAdminRights, handler.campaignsList);
    router.get('/:id', session.isAuthenticatedAdminRights, handler.content);
    router.delete('/:id', session.isAuthenticatedAdminRights, handler.remove);
    router.post('/upload',multipart, session.isAuthenticatedAdminRights, handler.upload);
    router.post('/update/:id',multipart, session.isAuthenticatedAdminRights, handler.update);
    return router;
};
