'use strict';

var express = require('express');
var router = express.Router();
var ContentHandler = require('../handlers/content');
var multipart = require( 'connect-multiparty' )();
var SessionHandler = require('../handlers/sessions');

module.exports = function (db) {

    var handler = new ContentHandler(db);
    var session = new SessionHandler(db);

    router.post('/s3save',multipart, handler.testS3Save);
    router.delete('/s3delete', handler.testS3Delete);
    router.delete('/s3deleteDir', handler.testS3DeleteDir);
    router.get('/s3get', handler.testS3Get);
    router.get('/s3list', handler.testS3List);


    router.get('/', session.isAuthenticated, handler.content);
    router.delete('/', session.isAuthenticated, handler.remove);
    router.post('/upload',multipart, session.isAuthenticated, handler.upload);
    router.post('/update',multipart, session.isAuthenticated, handler.update);
    return router;
};
