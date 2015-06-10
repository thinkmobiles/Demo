'use strict';

var RESPONSES = require('../constants/responses');
var fs = require("fs");
var logWriter = require('../helpers/logWriter')();
var SessionHandler = require('../handlers/sessions');
var UserHandler = require('../handlers/users');
var TariffPlanHandler = require('../handlers/tariffPlan');
var multipart = require( 'connect-multiparty' )();

module.exports = function (app, db) {
    var session = new SessionHandler();
    var userHandler = new UserHandler(db);
    var tariffPlanHandler = new TariffPlanHandler(db);
    var stripePlansRouter;

    // -----------------------

    app.use(function (req, res, next) {
        if (process.env.NODE_ENV === 'development') {
            console.log('user-agent:', req.headers['user-agent']);
        }
        next();
    });

    app.get('/', function (req, res, next) {
        res.sendfile('index.html');
    });

    app.post('/addCompany', userHandler.addCompany);
    app.get('/isAuth', session.isAuthenticatedUser);
    app.post('/signUp', userHandler.signUp);
    app.post('/upload', multipart, userHandler.upload);
    app.get('/redirect', userHandler.redirect);
    app.post('/signIn', userHandler.signIn);
    app.post('/signOut', session.kill);
    app.get('/now', session.authenticatedUser, function (req, res, next) {
        var now = new Date();
        res.status(200).send({
            now: now
        });
    });
    app.get('/currentUser', session.authenticatedUser, userHandler.getCurrentUser);
    app.get('/confirmEmail/:confirmToken', userHandler.confirmEmail);
    app.put('/profile', userHandler.updateCurrentUserProfile);
    app.post('/forgotPassword', userHandler.forgotPassword);
    app.post('/resetPassword', userHandler.resetPassword);
    app.get('/tariffPlans', session.authenticatedUser, tariffPlanHandler.getTariffPans);
    app.put('/renewal', tariffPlanHandler.renewal);


    stripePlansRouter = require('./stripePlans')(db);
    app.use('/stripe/plans', stripePlansRouter);


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