var async = require('async');
var mongoose = require('mongoose');
var _ = require('../public/js/libs/underscore/underscore-min');
var moment = require('moment');
var Analytic = require('../helpers/analytic');

var routeHandler = function (db) {

    var trackSchema = mongoose.Schemas['Track'];
    var TrackModel = db.model('Track', trackSchema);

    var userSchema = mongoose.Schemas['User'];
    var UserModel = db.model('User', userSchema);

    var contentSchema = mongoose.Schemas['Content'];
    var ContentModel = db.model('Content', contentSchema);

    var contactMeSchema = mongoose.Schemas['ContactMe'];
    var ContactMeModel = db.model('ContactMe', contactMeSchema);

    var analytic = new Analytic(db);

    this.contactsByDomain = function (req, res, next) {
        var domain = req.query.domain;
        async.waterfall([
            function (waterfallCb) {
                var userId = mongoose.Types.ObjectId(req.session.uId);
                ContentModel.findOne({ownerId: userId}, function (err, doc) {
                    if (err) {
                        return waterfallCb(err);
                    } else if (!doc) {
                        var error = new Error();
                        error.status = 404;
                        error.message = 'No Data';
                        return waterfallCb(error);
                    }
                    waterfallCb(null, doc._id)
                });
            },

            function (contentId, waterfallCb) {
                TrackModel.aggregate([{
                    $match: {
                        contentId: contentId,
                        domain: domain
                    }
                }, {
                    $project: {
                        name: {$concat: ['$firstName', " ", '$lastName']},
                        email: '$email',
                        _id: 0
                    }
                }, {
                    $sort: {
                        'name': 1
                    }
                }], function (err, docs) {
                    if (err) {
                        return next(err);
                    }
                    waterfallCb(null, docs);
                });
            }], function (err, docs) {
            if (err) {
                return next(err);
            }
            res.status(200).send(docs)
        });
    };


    this.visits = function (req, res, next) {
        var from = new Date(req.query.from);
        var date = new Date(req.query.to);
        var to = new Date(date.setHours(date.getHours() + 24));

        async.waterfall([
                function (waterfallCb) {
                    var userId = mongoose.Types.ObjectId(req.session.uId);
                    ContentModel.findOne({ownerId: userId}, function (err, doc) {
                        if (err) {
                            return waterfallCb(err);
                        } else if (!doc) {
                            var error = new Error();
                            error.status = 404;
                            error.message = 'No Data';
                            return waterfallCb(error);
                        }
                        waterfallCb(null, doc._id)
                    });
                },
                function (contentId, waterfallCb) {

                    TrackModel.aggregate([
                        {

                            $match: {
                                contentId: contentId,
                                updatedAt: {
                                    $gte: from, $lte: to
                                }
                            }
                        },
                        {
                            $project: {
                                date: {
                                    $add: [{$dayOfYear: '$updatedAt'}, {$multiply: [1000, {$year: '$updatedAt'}]}]
                                },
                                isNewViewer: 1
                            }
                        }, {
                            $group: {
                                _id: {
                                    date: '$date',
                                    isNewViewer: '$isNewViewer'
                                }, count: {$sum: 1}
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                count: 1,
                                date: '$_id.date',
                                new: {$cond: [{$eq: ['$_id.isNewViewer', true]}, '$count', 0]},
                                old: {$cond: [{$eq: ['$_id.isNewViewer', false]}, '$count', 0]}
                            }
                        }, {
                            $group: {
                                _id: '$date',
                                total: {$sum: '$count'},
                                old: {$sum: '$old'},
                                new: {$sum: '$new'}
                            }
                        }, {
                            $project: {
                                date: '$_id',
                                total: 1,
                                old: 1,
                                new: 1,
                                _id: 0
                            }
                        }], function (err, response) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        waterfallCb(null, response);
                    });
                },

                function (data, waterfallCb) {
                    var dataObj = _.indexBy(data, 'date');
                    var analytics = [];
                    while (from <= to) {
                        var numberDate = moment(from).dayOfYear() + (1000 * moment(from).year());
                        var obj = {
                            date: from,
                            old: dataObj[numberDate] ? dataObj[numberDate].old : 0,
                            new: dataObj[numberDate] ? dataObj[numberDate].new : 0,
                            total: dataObj[numberDate] ? dataObj[numberDate].total : 0
                        };
                        analytics.push(obj);
                        from = moment(from).add(1, 'days');
                    }
                    waterfallCb(null, analytics);
                }],
            function (err, docs) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(docs);
            }
        )
        ;
    };


    this.allDomain = function (req, res, next) {
        async.waterfall([
            function (waterfallCb) {
                var userId = mongoose.Types.ObjectId(req.session.uId);
                ContentModel.findOne({ownerId: userId}, function (err, doc) {
                    if (err) {
                        return waterfallCb(err);
                    } else if (!doc) {
                        var error = new Error();
                        error.status = 404;
                        error.message = 'No Data';
                        return waterfallCb(error);
                    }
                    waterfallCb(null, doc._id)
                });
            },

            function (contentId, waterfallCb) {
                TrackModel.aggregate([{
                    $match: {
                        contentId: contentId
                    }
                }, {
                    $group: {
                        _id: '$domain'
                    }
                }, {
                    $project: {domain: '$_id', _id: 0}

                }, {
                    $group: {
                        _id: null,
                        domains: {
                            $push: {domain: '$domain'}
                        }
                    }
                }, {
                    $project: {
                        domains: '$domains.domain',
                        _id: 0
                    }
                }], function (err, docs) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    waterfallCb(null, docs[0])
                });
            }], function (err, docs) {
            if (err) {
                return next(err);
            }
            res.status(200).send(docs.domains)
        });
    };

    this.contact = function (req, res, next) {
        var email = req.query.email;
        async.waterfall([
            function (waterfallCb) {
                var userId = mongoose.Types.ObjectId(req.session.uId);
                ContentModel.findOne({ownerId: userId}, function (err, doc) {
                    if (err) {
                        return waterfallCb(err);
                    } else if (!doc) {
                        var error = new Error();
                        error.status = 404;
                        error.message = 'No Data';
                        return waterfallCb(error);
                    }
                    waterfallCb(null, doc._id)
                });
            },

            function (contentId, waterfallCb) {
                TrackModel.aggregate([{
                    $match: {
                        contentId: contentId,
                        email: email
                    }
                }, {
                    $project: {
                        name: {$concat: ['$firstName', " ", '$lastName']},
                        questions: '$questions',
                        _id: 1, videos: '$videos',
                        documents: '$documents'
                    }
                }, {
                    $unwind: '$videos'
                }, {
                    $unwind: '$documents'
                }, {
                    $project: {
                        videos: {
                            video: '$videos.video',
                            time: '$videos.stopTime'
                        },
                        _id: 1,
                        questions: 1,
                        document: '$documents.document',
                        name: 1
                    }
                }, {
                    $group: {
                        _id: {
                            id: '$_id',
                            name: '$name',
                            questions: '$questions'
                        },
                        videos: {
                            $push: '$videos'
                        },
                        documents: {
                            $push: '$document'
                        }
                    }
                }, {
                    $project: {
                        name: '$_id.name',
                        questions: '$_id.questions',
                        documents: 1,
                        videos: 1,
                        _id: 0
                    }
                }], function (err, doc) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    waterfallCb(null, doc[0]);
                });
            }], function (err, doc) {
            if (err) {
                return next(err);
            }
            res.status(200).send(doc);
        });
    };

    this.contactMe = function (req, res, next) {
        var from = new Date(req.query.from);
        var date = new Date(req.query.to);
        var to = new Date(date.setHours(date.getHours() + 24));
        var userId = req.session.uId;
        async.waterfall([
            function (waterfallCb) {
                UserModel.findById(userId, function (err, user) {
                    if (err) {
                        return next(err);
                    } else if (!user) {
                        var error = new Error();
                        error.status = 404;
                        error.message = 'No Data';
                        return waterfallCb(error);
                    }
                    waterfallCb(null, user.contentId)
                });
            },
            function (contentId, waterfallCb) {

                ContactMeModel.find({
                    //contentId: contentId,
                    sentAt: {$gte: from, $lte: to}
                }, '-_id -__v -companyId', function (err, doc) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    waterfallCb(null, doc);
                });
            }], function (err, doc) {
            if (err) {
                return next(err);
            }
            res.status(200).send(doc);
        });
    };

    this.video = function (req, res, next) {
        var from = new Date(req.query.from);
        var date = new Date(req.query.to);
        var to = new Date(date.setHours(date.getHours() + 24));

        async.waterfall([

                function (waterfallCb) {
                    var userId = mongoose.Types.ObjectId(req.session.uId);
                    ContentModel.aggregate([{
                        $match: {
                            ownerId: userId
                        }
                    }, {
                        $group: {
                            _id: {
                                video: '$survey.videoUri', id: '$_id', mainVideo: '$mainVideoUri'
                            }
                        }
                    }, {
                        $project: {
                            videos: '$_id.video',
                            mainVideo: '$_id.mainVideo',
                            _id: 0, 'id': '$_id.id'

                        }
                    }], function (err, data) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        if (!data.length) {
                            var error = new Error();
                            error.status = 404;
                            error.message = 'No Data';
                            return waterfallCb(error);
                        }

                        waterfallCb(null, data[0]);
                    });
                },

                function (data, waterfallCb) {
                    TrackModel.aggregate([{
                        $match: {
                            'contentId': data.id,
                            'questTime': {$gte: from, $lte: to}

                        }
                    }, {
                        $project: {
                            firstName: 1,
                            lastName: 1,
                            videos: 1,
                            _id: 0
                        }
                    }, {
                        $unwind: '$videos'
                    }, {
                        $project: {
                            watchedEnd: {
                                $cond: [{$eq: ['$videos.end', true]}, {$add: [1]}, {$add: [0]}]
                            },
                            firstName: 1,
                            lastName: 1,
                            videos: 1
                        }
                    }, {
                        $group: {
                            _id: '$videos.video',
                            count: {$sum: 1},
                            watchedEnd: {$sum: '$watchedEnd'}
                        }
                    }, {
                        $project: {
                            name: '$_id',
                            count: 1,
                            watchedEnd: 1,
                            _id: 0
                        }
                    }], function (err, videoRes) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        waterfallCb(null, videoRes, data);
                    });
                },
                function (videoRes, data, waterfallCb) {
                    TrackModel.aggregate([{
                        $match: {
                            'contentId': data.id,
                            'questTime': {$gte: from, $lte: to}

                        }
                    }, {
                        $project: {
                            videos: 1,
                            _id: 1
                        }
                    }, {
                        $unwind: '$videos'
                    }, {
                        $group: {
                            _id: '$_id',
                            count: {$sum: 1}
                        }
                    }, {
                        $project: {
                            survey: {$cond: [{$gt: ['$count', 1]}, {$add: [1]}, {$add: [0]}]}
                        }
                    },
                        {
                            $group: {
                                _id: null,
                                all: {$sum: 1},
                                survey: {$sum: '$survey'}
                            }
                        }, {
                            $project: {
                                _id: 0,
                                all: 1,
                                survey: 1
                            }
                        }], function (err, surveyRes) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        waterfallCb(null, videoRes, data, surveyRes[0]);
                    });
                },
                function (videoRes, data, surveyRes, waterfallCb) {
                    var arr = [];
                    if (!data) {
                        var error = new Error();
                        error.status = 404;
                        error.message = 'No Data';
                        return waterfallCb(error);
                    }

                    //============Main Video Info===========
                    var mainVideo = {
                        name: data.mainVideo
                    };
                    var watchedEnd;
                    var fd = _.findWhere(videoRes, {name: data.mainVideo});
                    if (fd) {
                        mainVideo.count = fd.count;
                        watchedEnd = fd.watchedEnd;
                    } else {
                        mainVideo.count = 0;
                        watchedEnd = 0;
                    }

                    //============Survey Video Info===========
                    async.each(data.videos, function (video, eachCb) {
                        var obj = {};
                        obj.name = video;
                        var findDocument = _.findWhere(videoRes, {name: video});
                        if (findDocument) {
                            obj.count = findDocument.count;
                        } else {
                            obj.count = 0;
                        }
                        arr.push(obj);
                        eachCb(null);
                    }, function (err) {
                        if (err) {
                            return next(err);
                        }
                        var info = {
                            survey: arr,
                            mainVideo: mainVideo,
                            watchedEnd: watchedEnd,
                            watchedSurvey: surveyRes.survey,
                            all: surveyRes.all
                        };
                        waterfallCb(null, info);

                    });
                }],
            function (err, data) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(data);
            }
        )
        ;
    };

    this.question = function (req, res, next) {
        var reqFrom = new Date(req.query.from);
        var reqTo = new Date(req.query.to);
        var from = new Date(reqFrom.setHours(0));
        var to = new Date(reqTo.setHours(24));

        async.waterfall([
            function (waterfallCb) {
                var userId = mongoose.Types.ObjectId(req.session.uId);
                ContentModel.aggregate([
                    {
                        $match: {
                            ownerId: userId
                        }
                    }, {
                        $group: {
                            _id: {
                                question: '$survey.question',
                                id: '$_id'
                            }
                        }
                    }, {
                        $project: {
                            questions: '$_id.question',
                            _id: 0, 'id': '$_id.id'
                        }
                    }], function (err, data) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    if (!data.length) {
                        var error = new Error();
                        error.status = 404;
                        error.message = 'No Data';
                        return waterfallCb(error);
                    }
                    waterfallCb(null, data[0]);
                });
            },

            function (data, waterfallCb) {
                var arr = [];
                async.each(data.questions, function (question, eachCb) {
                    var obj = {};
                    obj.name = question;

                    TrackModel.aggregate([
                        {
                            $match: {
                                'contentId': data.id,
                                'questTime': {$gte: from, $lte: to}

                            }
                        }, {$project: {firstName: 1, lastName: 1, questions: 1, _id: 0}},
                        {$unwind: '$questions'},
                        {$match: {'questions.question': question}},
                        {$group: {_id: '$questions.item', count: {$sum: 1}}},
                        {$project: {rate: '$_id', _id: 0, count: 1}}
                    ], function (err, questRes) {
                        if (err) {
                            return eachCb(err);
                        }
                        obj.very = 0;
                        obj.not = 0;
                        obj.some = 0;
                        _.each(questRes, function (elem) {
                            obj[elem.rate] = elem.count;
                        });
                        arr.push(obj);
                        eachCb(null);
                    });
                }, function (err) {
                    if (err) {
                        return next(err);
                    }
                    waterfallCb(null, arr);
                });

            }], function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(200).send(data);
        });
    };

    this.document = function (req, res, next) {
        var from = new Date(req.query.from);
        var date = new Date(req.query.to);
        var to = new Date(date.setHours(date.getHours() + 24));
        var userId = req.session.uId;
        analytic.documents(userId, from, to, function(err, data){
            if(err){
                return next(err);
            }
            res.status(200).send(data);
        });

    };
};

module.exports = routeHandler;