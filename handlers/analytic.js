
var async = require('async');
var mongoose = require('mongoose');
var _ = require('../public/js/libs/underscore/underscore-min');
var moment = require('moment');

var routeHandler = function (db) {

    var trackSchema = mongoose.Schemas['Track'];
    var TrackModel = db.model('Track', trackSchema);

    var contentSchema = mongoose.Schemas['Content'];
    var ContentModel = db.model('Content', contentSchema);

    var contactMeSchema = mongoose.Schemas['ContactMe'];
    var ContactMeModel = db.model('ContactMe', contactMeSchema);

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
                    waterfallCb(null, doc);
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
        async.waterfall([
            function (waterfallCb) {
                var userId = mongoose.Types.ObjectId(req.session.uId);
                ContactMeModel.find({
                    companyId: userId,
                    sandedAt: {$gte: from, $lte: to}
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
                    TrackModel.aggregate([
                        {
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
                            $group: {
                                _id: '$videos.video',
                                count: {
                                    $sum: 1
                                }
                            }
                        }, {
                            $project: {
                                name: '$_id',
                                _id: 0,
                                count: 1
                            }
                        }
                    ], function (err, videoRes) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        waterfallCb(null, videoRes, data);
                    });
                },

                function (videoRes, data, waterfallCb) {
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
                    var fd = _.findWhere(videoRes, {name: data.mainVideo});
                    if (fd) {
                        mainVideo.count = fd.count;
                    } else {
                        mainVideo.count = 0;
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
                            mainVideo: mainVideo
                        };
                        waterfallCb(null, info);

                    });
                }
            ],
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
                                pdf: '$survey.pdfUri',
                                id: '$_id'
                            }
                        }
                    }, {
                        $project: {
                            documents: '$_id.pdf',
                            _id: 0,
                            'id': '$_id.id'
                        }
                    }, {
                        $unwind: '$documents'
                    }, {
                        $unwind: '$documents'
                    }, {
                        $group: {
                            _id: '$id',
                            doc: {
                                $addToSet: '$documents'
                            }
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
                TrackModel.aggregate([
                    {
                        $match: {
                            'contentId': data._id,
                            'documents.time': {$gte: from, $lte: to}

                        }
                    }, {
                        $project: {
                            firstName: 1,
                            lastName: 1,
                            documents: 1,
                            _id: 0
                        }
                    }, {
                        $unwind: '$documents'
                    }, {
                        $group: {
                            _id: '$documents.document',
                            count: {
                                $sum: 1
                            }
                        }
                    }, {
                        $project: {
                            name: '$_id',
                            _id: 0,
                            count: 1
                        }
                    }], function (err, trackResp) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    waterfallCb(null, trackResp, data);
                });
            },

            function (trackResp, data, waterfallCb) {
                var arr = [];
                async.each(data.doc, function (pdf, eachCb) {
                    var obj = {};
                    obj.name = pdf;
                    var findDocument = _.findWhere(trackResp, {name: pdf});
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
                    waterfallCb(null, arr);

                });
            }], function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(200).send(data);
        });
    };
};

module.exports = routeHandler;