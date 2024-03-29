'use strict';

var mongoose = require('mongoose');
var db;

if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production'; //TODO: use production
    //process.env.NODE_ENV = 'development';
}

require('./config/' + process.env.NODE_ENV);

mongoose.connect(process.env.DB_HOST, process.env.DB_NAME);
db = mongoose.connection;

db.on('error', function (err) {
    console.error('Connection Error: ', err);
});
db.once('open', function() {
    console.log('Connection to ' + process.env.DB_HOST + '/' + process.env.DB_NAME + ' is success');

    require('./models/index');

    var sessionSchema = mongoose.Schema({
        _id: String,
        session: String,
        expires: Date
    }, {collection: 'sessions'});

    var sessions = db.model('sessions', sessionSchema);
    var port = process.env.PORT || 8877;
    var http = require('http');
    var path = require('path');
    var fs = require("fs");
    var express = require('express');
    var session = require('express-session');
    var logger = require('morgan');
    var bodyParser = require('body-parser');
    var consolidate = require('consolidate');
    var app = express();
    var logWriter = require('./helpers/logWriter')();
    var Schedule = require('./helpers/emailNotification');
    var schedule =new Schedule(db);
    var MemoryStore = require('connect-mongo')(session);
    var sessionConfig = {
        db: db.name,
        host: db.host,
        port: db.port,
        saveUninitialized: false,
        resave: false
    };

    schedule.runSchedule();
    var allowCrossDomain = function (req, res, next) {
        var browser = req.headers['user-agent'];
        if (/Trident/.test(browser)) {
            res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        }
        next();
    };

    app.use(allowCrossDomain);

    app.use(express.static(__dirname + '/public'));
    app.engine('html', consolidate.swig);
    app.set('views', __dirname + '/public/static');
    app.set('view engine', 'html');
    app.use(logger('dev'));

    app.use(bodyParser.json({strict: false, inflate: false, limit: 1024 * 1024 * 5}));
    app.use(bodyParser.urlencoded({extended: false, limit: 1024 * 1024 * 5}));

    app.use(express.static(path.join(__dirname, 'public')));

    app.use(session({
        name: 'Demo',
        secret: '1q2w3e4r5tdhgkdfhgejflkejghylgh8j0jge4547hh',
        resave: false,
        saveUninitialized: false,
        store: new MemoryStore(sessionConfig)
    }));

    require('./routes/index')(app, db);

    Array.prototype.objectID = function () {
        var _arrayOfID = [];
        var objectId = mongoose.Types.ObjectId;

        for (var i = 0; i < this.length; i++) {
            if (this[i] && typeof this[i] == 'object' && this[i].hasOwnProperty('_id')) {
                _arrayOfID.push(this[i]._id);
            } else {
                if (typeof this[i] == 'string' && this[i].length === 24) {
                    _arrayOfID.push(objectId(this[i]));
                }
                if (this[i] === null || this[i] === 'null') {
                    _arrayOfID.push(null);
                }

            }
        }
        return _arrayOfID;
    };

    app.listen(port, function () {
        console.log('==============================================================');
        console.log('|| server start success on port=' + port + ' in ' + process.env.NODE_ENV + ' version ||');
        console.log('==============================================================\n');
    });
});

module.exports = {
    db: db
};
