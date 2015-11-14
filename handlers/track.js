
var async = require('async');
var mongoose = require('mongoose');
var http = require('http');
var request = require('request');

var _ = require('lodash');

var moment = require('moment');
var routeHandler = function (db) {


    var trackSchema = mongoose.Schemas['Track'];
    var TrackModel = db.model('Track', trackSchema);
    var self = this;

    this.question = function (req, res, next) {

        if (!req.body.userId || !req.body.contentId) {
            return res.status(403).send("Invalid parameters");
        }
        var data = req.body;
        var jumpleadId = req.body.userId;
        var contentId = req.body.contentId;
        TrackModel.findOneAndUpdate({
            "jumpleadId": jumpleadId,
            "contentId": contentId,
            "isSent": false
        }, {$set: {questions: data.questions, questTime: Date.now()}}, {upsert: true}, function (err) {
            if (err) {
                return next(err);
            }
            TrackModel.findOneAndUpdate({
                "jumpleadId": jumpleadId,
                "contentId": contentId,
                "isSent": false
            }, {
                $set: {
                    updatedAt: Date.now()
                }
            }, function (err) {
                if (err) {
                    return next(err);
                }
                res.status(200).send("Successful update");
            });
        });
    };




    this.document = function (req, res, next) {
        var body = req.body;
        if (!body.document || !body.userId || !body.contentId) {
            return res.status(403).send("Invalid parameters");
        }
        var jumpleadId = body.userId;
        var contentId = body.contentId;
        var document = {
            document: body.document
        };
        var obj = {
            "jumpleadId": jumpleadId,
            "contentId": contentId,
            "isSent": false,
            "documents.document": body.document
        };

        TrackModel.findOne(obj, function (err, doc) {
            if (err) {
                return next(err);
            }
            if (!doc) {
                TrackModel.findOneAndUpdate({
                    "jumpleadId": jumpleadId,
                    "contentId": contentId,
                    "isSent": false
                }, {
                    $addToSet: {
                        "documents": {
                            time: Date.now(),
                            document: body.document
                        }
                    }
                }, {upsert: true, new: true}, function (err, doc) {
                    if (err) {
                        return next(err);
                    }
                    TrackModel.findByIdAndUpdate(doc._id, {
                        $set: {
                            updatedAt: Date.now()
                        }
                    }, function (err) {
                        if (err) {
                            return next(err);
                        }
                        return res.status(200).send("Successful create");
                    });
                });
            } else {
                var findDocument = _.findWhere(doc.documents, {document: body.document});

                if (!findDocument) {
                    TrackModel.findOneAndUpdate({
                        "jumpleadId": jumpleadId,
                        "contentId": contentId,
                        "isSent": false
                    }, {
                        $addToSet: {
                            "documents": {
                                time: Date.now(),
                                document: body.document
                            }
                        }
                    }, function (err) {
                        if (err) {
                            return next(err);
                        }
                        TrackModel.findByIdAndUpdate(doc._id, {
                            $set: {
                                updatedAt: Date.now()
                            }
                        }, function (err) {
                            if (err) {
                                return next(err);
                            }
                            return res.status(200).send("Successful create");
                        });
                    });
                } else {
                    res.status(200).send("User already download this document");
                }
            }
        });
    };

    this.video = function (req, res, next) {
        var body = req.body;
        var data = body.data;
        if (!data.video || !data.stopTime || !body.userId || !body.contentId) {
            return res.status(403).send("Invalid parameters");
        }
        var jumpleadId = body.userId;
        var contentId = body.contentId;
        var obj = {
            "jumpleadId": jumpleadId,
            "contentId": contentId,
            "isSent": false,
            "videos.video": body.data.video
        };

        TrackModel.findOne(obj, function (err, doc) {
            if (err) {
                return next(err);
            }
            if (!doc) {
                TrackModel.findOneAndUpdate({
                    "jumpleadId": jumpleadId,
                    "contentId": contentId,
                    "isSent": false
                }, {
                    "jumpleadId": jumpleadId,
                    "contentId": contentId,
                    "isSent": false,
                    "updatedAt": Date.now()
                }, {upsert: true, new: true}, function (err, doc) {
                    if (err) {
                        return next(err);
                    }
                    data.time = Date.now();
                    TrackModel.findByIdAndUpdate(doc._id, {
                        $addToSet: {
                            "videos": data
                        }
                    }, function (err) {
                        if (err) {
                            return next(err);
                        }
                        return res.status(200).send("Successful create");
                    });
                });
            } else {
                var fvideo = _.findWhere(doc.videos, {video: body.data.video});
                if (!fvideo.end && fvideo.stopTime < body.data.stopTime) {
                    TrackModel.findOneAndUpdate({
                        "jumpleadId": jumpleadId,
                        "contentId": contentId,
                        "isSent": false,
                        "videos.video": body.data.video
                    }, {
                        $set: {
                            "videos.$.time": Date.now(),
                            "videos.$.stopTime": body.data.stopTime,
                            "videos.$.end": body.data.end,
                            updatedAt: Date.now()
                        }
                    }, function (err) {
                        if (err) {
                            return next(err);
                        }
                        return res.status(200).send("Successful update");
                    });
                } else {
                    res.status(200).send("User already watched this video longer time");
                }
            }
        });
    };
};

module.exports = routeHandler;
