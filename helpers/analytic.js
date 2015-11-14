'use strict';

var _ = require('lodash');
var moment = require('moment');
var mongoose = require('mongoose');
var request = require('request');
var async = require('async');

var AnalyticModule = function (db) {

    var trackSchema = mongoose.Schemas['Track'];
    var TrackModel = db.model('Track', trackSchema);

    var contentSchema = mongoose.Schemas['Content'];
    var ContentModel = db.model('Content', contentSchema);

    var self = this;
    this.totalVisits = function (userId, from, to, callback) {
        var uId = mongoose.Types.ObjectId(userId);
        async.waterfall([
                function (waterfallCb) {
                    ContentModel.findOne({ownerId: uId}, function (err, doc) {
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
                                isNewViewer: 1
                            }
                        }, {
                            $group: {
                                _id: {
                                    isNewViewer: '$isNewViewer'
                                }, count: {$sum: 1}
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                count: 1,
                                new: {$cond: [{$eq: ['$_id.isNewViewer', true]}, '$count', 0]},
                                old: {$cond: [{$eq: ['$_id.isNewViewer', false]}, '$count', 0]}
                            }
                        }, {
                            $group: {
                                _id: 'null',
                                total: {$sum: '$count'},
                                old: {$sum: '$old'},
                                new: {$sum: '$new'}
                            }
                        }, {
                            $project: {
                                total: 1,
                                old: 1,
                                new: 1,
                                _id: 0
                            }
                        }], function (err, response) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        waterfallCb(null, response[0]);
                    });
                }],
            function (err, data) {
                if (err) {
                    return callback(err);
                } else if (!data) {
                    var obj2 = {
                        old: 0,
                        new: 0,
                        total: 0
                    };
                    callback(null, obj2);
                }
                var obj = {
                    old: data.old || 0,
                    new: data.new || 0,
                    total: data.total || 0
                };
                callback(null, obj);
            });
    };
    this.uninterested = function (userId, from, to, callback) {
        var uId = mongoose.Types.ObjectId(userId);
        async.waterfall([
                function (waterfallCb) {
                    ContentModel.aggregate([{
                        $match: {
                            ownerId: uId
                        }
                    }, {
                        $group: {
                            _id: {
                                video: '$survey.videoUri', id: '$_id', mainVideo: '$mainVideoUri'
                            }
                        }
                    }, {
                        $project: {
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
                    TrackModel.find({
                        'contentId': data.id,
                        'videos.time': {$gte: from, $lte: to}
                    }, function (err, docs) {
                        var arr = [];
                        if (!data) {
                            var error = new Error();
                            error.status = 404;
                            error.message = 'No Data';
                            return waterfallCb(error);
                        }
                        async.each(docs, function (doc, eachCb) {
                            if (doc.videos.length === 1 && doc.videos[0].video === data.mainVideo && doc.videos[0].end === false) {
                                arr.push({name: doc.firstName + ' ' + doc.lastName});
                            }
                            eachCb(null);
                        }, function (err) {
                            if (err) {
                                return next(err);
                            }
                            waterfallCb(null, arr);

                        });
                    });
                }],
            function (err, data) {
                if (err) {
                    return callback(err);
                }
                callback(null, data);
            });
    };


    this.visits = function (userId, from, to, callback) {
        var uId = mongoose.Types.ObjectId(userId);
        async.waterfall([
                function (waterfallCb) {
                    ContentModel.findOne({ownerId: uId}, function (err, doc) {
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
                        }, {
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
                    return callback(err);
                }
                callback(null, docs);
            });
    };

    this.video = function (userId, from, to, callback) {
        var uId = mongoose.Types.ObjectId(userId);

        async.waterfall([
                function (waterfallCb) {
                    ContentModel.aggregate([{
                        $match: {
                            ownerId: uId
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
                            'videos.time': {$gte: from, $lte: to}

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
                            'videos.time': {$gte: from, $lte: to}

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
                                survey: {$sum: '$survey'}
                            }
                        }, {
                            $project: {
                                _id: 0,
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
                    TrackModel.aggregate([
                        {

                            $match: {
                                contentId: data.id,
                                'videos.time': {
                                    $gte: from, $lte: to
                                }
                            }
                        },
                        {
                            $project: {
                                isNewViewer: 1
                            }
                        }, {
                            $group: {
                                _id: {
                                    isNewViewer: '$isNewViewer'
                                }, count: {$sum: 1}
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                count: 1
                            }
                        }, {
                            $group: {
                                _id: 'null',
                                total: {$sum: '$count'}
                            }
                        }, {
                            $project: {
                                total: 1,
                                _id: 0
                            }
                        }], function (err, response) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        waterfallCb(null, videoRes, data, surveyRes, response[0]);
                    });
                },
                function (videoRes, data, surveyRes, allRes, waterfallCb) {
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
                    mainVideo.count = fd ? fd.count : 0;
                    watchedEnd = fd ? fd.watchedEnd : 0;


                    //============Survey Video Info===========
                    async.each(data.videos, function (video, eachCb) {
                        var obj = {};
                        obj.name = video;
                        var findDocument = _.findWhere(videoRes, {name: video});
                        obj.count = findDocument ? findDocument.count : 0;

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
                            watchedSurvey: surveyRes ? surveyRes.survey : 0,
                            all: allRes ? allRes.total : 0
                        };
                        waterfallCb(null, info);

                    });
                }],
            function (err, data) {
                if (err) {
                    return callback(err);
                }
                callback(null, data);
            });
    };

    this.question = function (userId, from, to, callback) {
        var uId = mongoose.Types.ObjectId(userId);
        async.waterfall([
            function (waterfallCb) {
                ContentModel.aggregate([
                    {
                        $match: {
                            ownerId: uId
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
                        }, {
                            $project: {
                                firstName: 1,
                                lastName: 1,
                                questions: 1,
                                _id: 0
                            }
                        }, {
                            $unwind: '$questions'
                        }, {
                            $match: {
                                'questions.question': question
                            }
                        }, {
                            $group: {
                                _id: '$questions.item',
                                count: {$sum: 1}
                            }
                        }, {
                            $project: {
                                rate: '$_id',
                                _id: 0,
                                count: 1
                            }
                        }], function (err, questRes) {
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
                return callback(err);
            }
            callback(null, data);
        });
    };

    this.document = function (userId, from, to, callback) {
        var uId = mongoose.Types.ObjectId(userId);
        async.waterfall([
            function (waterfallCb) {
                ContentModel.aggregate([
                    {
                        $match: {
                            ownerId: uId
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
                TrackModel.aggregate([{
                    $match: {
                        'contentId': data._id,
                        'questTime': {$gte: from, $lte: to}

                    }
                }, {$project: {documents: 1, _id: 1}}, {
                    $unwind: '$documents'
                }, {$group: {_id: null, doc: {$addToSet: '$_id'}, count: {$sum: 1}}}, {
                    $project: {_id: 0, download: {$size: '$doc'}}
                }], function (err, downloadRes) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    waterfallCb(null, trackResp, data, downloadRes[0]);
                });

            },
            function (trackResp, data, downloadRes, waterfallCb) {
                var arr = [];
                async.each(data.doc, function (pdf, eachCb) {
                    var obj = {};
                    obj.name = pdf;
                    var findDocument = _.findWhere(trackResp, {name: pdf});
                    obj.count = findDocument ? findDocument.count : 0;
                    arr.push(obj);
                    eachCb(null);
                }, function (err) {
                    if (err) {
                        return next(err);
                    }
                    var data = {
                        docs: arr,
                        download: downloadRes ? downloadRes.download : 0
                    };
                    waterfallCb(null, data);

                });
            }], function (err, data) {
            if (err) {
                return callback(err);
            }
            callback(null, data);
        });
    }
};
module.exports = AnalyticModule;
