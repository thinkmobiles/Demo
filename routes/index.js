'use strict';

var RESPONSES = require('../constants/responses');
var fs = require("fs");
var logWriter = require('../helpers/logWriter')();
var Handler = require('../handlers/users');
var EditHandler = require('../handlers/edit');
var SessionHandler = require('../handlers/sessions');
var multipart = require( 'connect-multiparty' )();

module.exports = function (app, db) {
    var handler = new Handler(db);
    var editHandler = new EditHandler(db);
    var session = new SessionHandler(db);
    var analyticRouter = require('./analytic')(db);
    var trackRouter = require('./track')(db);
    var adminRouter = require('./admin')(db);


    app.use(function (req, res, next) {
        if (process.env.NODE_ENV === 'development') {
            console.log('user-agent:', req.headers['user-agent']);
        }
        next();
    });

    app.get('/', function (req, res, next) {
        res.sendfile('index.html');
    });

    //app.get('/sendWeekly', handler.sendWeekly);
    app.get('/sendDaily', handler.sendDaily);
    app.get('/sendWeekly', handler.sendWeekly);
    app.get('/content/:contentId/:ctid', handler.getMain);
    app.post('/prospectSignUp', handler.prospectSignUp);
    app.get('/share', handler.share);
    app.post('/sendContactMe', handler.sendContactMe);
    app.post('/signUp', handler.signUp);
    app.post('/login', handler.login);
    app.get('/avatar/:userName', handler.avatar);
    app.get('/logout', session.kill);
    app.get('/currentUser',session.isAuthenticated, handler.currentUser);
    app.get('/redirect', handler.redirect);
    app.post('/upload',multipart, session.isAuthenticated, handler.upload);
    app.post('/upload',multipart, session.isAuthenticated, editHandler.edit);
    app.get('/content', session.isAuthenticated, handler.content);
    app.delete('/content', session.isAuthenticated, handler.removeContent);

    // ----------------------------------------------------------
    // Routers:
    // ----------------------------------------------------------

    app.use('/analytic', analyticRouter);
    app.use('/track', trackRouter);
    app.use('/admin', adminRouter);


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