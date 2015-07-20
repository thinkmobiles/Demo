'use strict';

var _ = require('../public/js/libs/underscore/underscore-min');
var moment = require('moment');
var mongoose = require('mongoose');
var request = require('request');
var async = require('async');

var AnalyticModule = function (db) {

    var prospectSchema = mongoose.Schemas['Prospect'];
    var ProspectModel = db.model('Prospect', prospectSchema);

    var trackSchema = mongoose.Schemas['Track'];
    var TrackModel = db.model('Track', trackSchema);

    var contentSchema = mongoose.Schemas['Content'];
    var ContentModel = db.model('Content', contentSchema);

    var userSchema = mongoose.Schemas['User'];
    var UserModel = db.model('User', userSchema);

    var contactMeSchema = mongoose.Schemas['ContactMe'];
    var ContactMeModel = db.model('ContactMe', contactMeSchema);


    var self = this;

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
                return callback(err);
            }
            callback(null, data);
        });
    };

    this.documents = function (userId, from, to, callback) {
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
                }, {
                    $project: {
                        documents: 1,
                        _id: 1
                    }
                }, {
                    $unwind: '$documents'
                }, {
                    $group: {
                        _id: '$_id',
                        count: {$sum: 1}
                    }
                }, {
                    $project: {
                        download: {$cond: [{$gt: ['$count', 1]}, {$add: [1]}, {$add: [0]}]}
                    }
                },
                    {
                        $group: {
                            _id: null,
                            all: {$sum: 1},
                            download: {$sum: '$download'}
                        }
                    }, {
                        $project: {
                            _id: 0,
                            all: 1,
                            download: 1
                        }
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
                    var data = {
                        docs: arr,
                        all: downloadRes.all,
                        download: downloadRes.download
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
