var async = require('async');
var mongoose = require('mongoose');
var _ = require('../public/js/libs/underscore/underscore-min');
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
        var userId = req.session.uId;
        var error = new Error();

        if (!domain) {
            error.status = 400;
            error.message = 'Bad Request';
            return next(error);
        }

        async.waterfall([
            function (waterfallCb) {
                ContentModel.findOne({ownerId: userId}, function (err, doc) {
                    if (err) {
                        return waterfallCb(err);
                    } else if (!doc) {
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
                        return waterfallCb(err);
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

    this.uninterested = function (req, res, next) {
        var userId = req.session.uId;
        var error = new Error();
        var reqFrom, reqTo, from, to;

        if (!req.query.from || !req.query.to) {
            error.status = 400;
            error.message = 'Bad Request';
            return next(error);
        }
        reqFrom = new Date(req.query.from);
        reqTo = new Date(req.query.to);
        from = new Date(reqFrom.setHours(0));
        to = new Date(reqTo.setHours(24));

        analytic.uninterested(userId, from, to, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(200).send(data);
        });
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
                            $addToSet: {domain: '$domain'}
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
            var domains = docs ? docs.domains : [];
            res.status(200).send(domains);
        });
    };

    this.contact = function (req, res, next) {
        var email = req.query.email;
        var error = new Error();
        var contentId;

        if (!email) {
            error.status = 400;
            error.message = 'Bad Request';
            return next(error);
        }

        async.waterfall([
            function (waterfallCb) {
                var userId = mongoose.Types.ObjectId(req.session.uId);
                ContentModel.findOne({ownerId: userId}, function (err, doc) {
                    if (err) {
                        return waterfallCb(err);
                    } else if (!doc) {
                        error.status = 404;
                        error.message = 'No Data';
                        return waterfallCb(error);
                    }
                    contentId =  doc._id;
                    waterfallCb(null)
                });
            },

            function ( waterfallCb) {
                TrackModel.aggregate([{
                    $match: {
                        contentId: contentId,
                        email: email
                    }
                }, {
                    $project: {
                        name: {$concat: ['$firstName', " ", '$lastName']},
                        questions: '$questions',
                        videos: '$videos',
                        documents: '$documents',
                        _id: 1
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
                            $addToSet: '$videos'
                        },
                        documents: {
                            $addToSet: '$document'
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
            },

            function (data, waterfallCb) {
                if(!data){
                    TrackModel.aggregate([{
                        $match: {
                            contentId: contentId,
                            email: email
                        }
                    }, {
                        $project: {
                            name: {$concat: ['$firstName', " ", '$lastName']},
                            questions: '$questions',
                            videos: '$videos',
                            documents: '$documents',
                            _id: 1
                        }
                    }, {
                        $unwind: '$videos'
                    }, {
                        $project: {
                            videos: {
                                video: '$videos.video',
                                time: '$videos.stopTime'
                            },
                            _id: 1,
                            questions: 1,
                            document: 1,
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
                                $addToSet: '$videos'
                            }
                        }
                    }, {
                        $project: {
                            name: '$_id.name',
                            questions: '$_id.questions',
                            videos: 1,
                            _id: 0
                        }
                    }], function (err, doc) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        waterfallCb(null, doc[0]);
                    });
                } else {
                    return waterfallCb(null, data);
                }
            }
        ], function (err, doc) {
            if (err) {
                return next(err);
            }
            var obj = {
                name: doc && doc.name ? doc.name : '',
                questions: doc && doc.questions ? doc.questions : [],
                videos: doc && doc.videos ? doc.videos : [],
                documents: doc && doc.documents ? doc.documents : []
            };
            res.status(200).send(obj);
        });
    };


    this.contacts = function (req, res, next) {
        var domain = req.query.domain;
        var error = new Error();

        if (!domain) {
            error.status = 400;
            error.message = 'Bad Request';
            return next(error);
        }

        async.waterfall([
            function (waterfallCb) {
                var userId = mongoose.Types.ObjectId(req.session.uId);
                ContentModel.findOne({ownerId: userId}, function (err, doc) {
                    if (err) {
                        return waterfallCb(err);
                    } else if (!doc) {
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
                        questions: '$questions',
                        videos: '$videos',
                        documents: '$documents',
                        _id: 1
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
                            $addToSet: '$videos'
                        },
                        documents: {
                            $addToSet: '$document'
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
                }], function (err, docs) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    waterfallCb(null, docs);
                });
            }], function (err, docs) {
            if (err) {
                return next(err);
            }
            res.status(200).send(docs);
        });
    };

    this.contactMe = function (req, res, next) {
        var userId = req.session.uId;
        var error = new Error();
        var reqFrom, reqTo, from, to;

        if (!req.query.from || !req.query.to) {
            error.status = 400;
            error.message = 'Bad Request';
            return next(error);
        }
        reqFrom = new Date(req.query.from);
        reqTo = new Date(req.query.to);
        from = new Date(reqFrom.setHours(0));
        to = new Date(reqTo.setHours(24));

        async.waterfall([
            function (waterfallCb) {
                UserModel.findById(userId, function (err, user) {
                    if (err) {
                        return next(err);
                    } else if (!user || !user.contentId) {
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
                    contentId: contentId,
                    sentAt: {$gte: from, $lte: to}
                }, '-_id -__v -contentId', function (err, doc) {
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

    this.visits = function (req, res, next) {
        var userId = req.session.uId;
        var error = new Error();
        var reqFrom, reqTo, from, to;

        if (!req.query.from || !req.query.to) {
            error.status = 400;
            error.message = 'Bad Request';
            return next(error);
        }
        reqFrom = new Date(req.query.from);
        reqTo = new Date(req.query.to);
        from = new Date(reqFrom.setHours(0));
        to = new Date(reqTo.setHours(24));

        analytic.visits(userId, from, to, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(200).send(data);
        });
    };


    this.totalVisits = function (req, res, next) {
        var userId = req.session.uId;
        var error = new Error();
        var reqFrom, reqTo, from, to;

        if (!req.query.from || !req.query.to) {
            error.status = 400;
            error.message = 'Bad Request';
            return next(error);
        }
        reqFrom = new Date(req.query.from);
        reqTo = new Date(req.query.to);
        from = new Date(reqFrom.setHours(0));
        to = new Date(reqTo.setHours(24));

        analytic.totalVisits(userId, from, to, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(200).send(data);
        });
    };

    this.video = function (req, res, next) {
        var userId = req.session.uId;
        var error = new Error();
        var reqFrom, reqTo, from, to;

        if (!req.query.from || !req.query.to) {
            error.status = 400;
            error.message = 'Bad Request';
            return next(error);
        }
        reqFrom = new Date(req.query.from);
        reqTo = new Date(req.query.to);
        from = new Date(reqFrom.setHours(0));
        to = new Date(reqTo.setHours(24));

        analytic.video(userId, from, to, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(200).send(data);
        });
    };

    this.question = function (req, res, next) {
        var userId = req.session.uId;
        var error = new Error();
        var reqFrom, reqTo, from, to;

        if (!req.query.from || !req.query.to) {
            error.status = 400;
            error.message = 'Bad Request';
            return next(error);
        }
        reqFrom = new Date(req.query.from);
        reqTo = new Date(req.query.to);
        from = new Date(reqFrom.setHours(0));
        to = new Date(reqTo.setHours(24));

        analytic.question(userId, from, to, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(200).send(data);
        });
    };

    this.document = function (req, res, next) {
        var userId = req.session.uId;
        var error = new Error();
        var reqFrom, reqTo, from, to;

        if (!req.query.from || !req.query.to) {
            error.status = 400;
            error.message = 'Bad Request';
            return next(error);
        }
        reqFrom = new Date(req.query.from);
        reqTo = new Date(req.query.to);
        from = new Date(reqFrom.setHours(0));
        to = new Date(reqTo.setHours(24));

        analytic.document(userId, from, to, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(200).send(data);
        });

    };
};

module.exports = routeHandler;