'use strict';

var RESPONSES = require('../constants/responses');
var fs = require("fs");
var logWriter = require('../helpers/logWriter')();
var Handler = require('../handlers/users');
var multipart = require( 'connect-multiparty' )();

module.exports = function (app, db) {
    var handler = new Handler(db);

    app.use(function (req, res, next) {
        if (process.env.NODE_ENV === 'development') {
            console.log('user-agent:', req.headers['user-agent']);
        }
        next();
    });

    app.get('/', function (req, res, next) {
        res.sendfile('index.html');
    });
    app.get('/share', handler.share);
    app.post('/trackDocument', handler.trackDocument);
    app.post('/trackQuestion', handler.trackQuestion);
    app.post('/trackVideo', handler.trackVideo);
    app.get('/questionInfo', handler.questionInfo);
    app.get('/documentInfo', handler.documentInfo);
    app.get('/videoInfo', handler.videoInfo);
    app.get('/visitsInfo', handler.visitsInfo);
    app.get('/contactByDomain', handler.getContactByDomain);
    app.get('/allDomain', handler.getAllDomain);


    app.get('/content', handler.content);
    app.post('/prospectSignUp', handler.prospectSignUp);

    app.post('/signUp', handler.signUp);
    app.post('/login', handler.login);
    app.get('/logout', handler.logout);
    app.get('/currentUser', handler.currentUser);
    app.get('/redirect', handler.redirect);

    app.get('/avatar/:userName', handler.avatar);
    app.get('/allContacts/:id', handler.allContacts);
    //app.get('/:uid/:cid', handler.contact);
    app.get('/content/:contentId/:ctid', handler.getMain);
    app.get('/allUsers', handler.allUsers);
    app.post('/sendContactMe', handler.sendContactMe);
    app.post('/upload', multipart, handler.upload);
    app.post('/pdf', multipart, handler.pdf);


    // ----------------------------------------------------------
    // Error Handler:
    // ----------------------------------------------------------
    function notFound(req, res, next) {
        res.status(404);

        if (req.accepts('html')) {
            return res.send(RESPONSES.PAGE_NOT_FOUND);
        }

        if (req.accepts('json')) {
            return res.json({error: RESPONSES.PAGE_NOT_FOUND});
        }

        res.type('txt');
        res.send(RESPONSES.PAGE_NOT_FOUND);
    };

    function errorHandler(err, req, res, next) {
        var status = err.status || 500;

        if (process.env.NODE_ENV === 'production') {
            if (status === 401) {
                logWriter.log('', err.message + '\n' + err.stack);
            }
            res.status(status).send({error: err.message});
        } else {
            if (status !== 401) {
                logWriter.log('', err.message + '\n' + err.stack);
            }
            res.status(status).send({error: err.message, stack: err.stack});
        }
    };

    app.use(notFound);
    app.use(errorHandler);
};