'use strict';

var express = require('express');
var router = express.Router();
var TrackHandler = require('../handlers/track');

module.exports = function (db) {

    var handler = new TrackHandler(db);
    router.post('/document', handler.document);
    router.post('/question', handler.question);
    router.post('/video', handler.video);


    return router;
};
