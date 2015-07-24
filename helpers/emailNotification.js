var NodeCronTab = require('node-crontab');
var mongoose = require('mongoose');
var async = require('async');
var Analytic = require('../helpers/analytic');
var moment = require('moment');

var Schedule = function (db) {
    var trackSchema = mongoose.Schemas['Track'];
    var TrackModel = db.model('Track', trackSchema);

    var contentSchema = mongoose.Schemas['Content'];
    var ContentModel = db.model('Content', contentSchema);
    var mailer = require('./mailer');
    var analytic = new Analytic(db);

    this.runSchedule = function () {
        var cronJob = NodeCronTab.scheduleJob('0 0 */1 * * *', function () { //production every 2 hours
                //var cronJob = NodeCronTab.scheduleJob('*/10 * * * * *', function () { //every 2 minutes
            var hour = 60 * 60 * 1000;
            var time = new Date(Date.now() - 2 * hour);
            var conditions = {
                'isSent': false,
                'updatedAt': {$lte: time}
            };
            var update = {
                isSent: true
            };

            async.waterfall([

                    //find all docs older than 2 hour & 'isSent'=false
                    function (waterfallCb) {
                        TrackModel.find(conditions, function (err, docs) {
                            if (err) {
                                return waterfallCb(err);
                            }
                            if (!docs.length) {
                                var error = new Error();
                                error.message = 'No data to send';
                                return waterfallCb(error);
                            }
                            console.log('tracks at ' + new Date(Date.now()));
                            console.log(docs);
                            waterfallCb(null, docs)
                        });
                    },

                    // supplement name & email field if they missing
                    function (docs, waterfallCb) {
                        async.each(docs, function (track, eachCb) {
                            if (!track.firstName || !track.lastName || !track.email) {
                                TrackModel.findOne({jumpleadId: track.jumpleadId}, function (err, doc) {
                                    if (err) {
                                        return eachCb(err);
                                    }
                                    track.firstName = doc.firstName;
                                    track.lastName = doc.lastName;
                                    track.email = doc.email;
                                    eachCb(null);
                                })
                            } else {
                                return eachCb(null);
                            }
                        }, function (err) {
                            if (err) {
                                return waterfallCb(err);
                            }
                            waterfallCb(null, docs)
                        });
                    },

                    //Populate contentId field
                    function (docs, waterfallCb) {
                        ContentModel.populate(docs, {path: 'contentId'}, function (err, popDocs) {
                            if (err) {
                                return waterfallCb(err);
                            }
                            waterfallCb(null, popDocs);
                        });
                    },

                    //send notification to company email
                    function (docs, waterfallCb) {
                        async.each(docs, function (doc, cb) {
                            var name = doc.firstName + ' ' + doc.lastName;
                            var data = {
                                companyName: doc.name,
                                companyEmail: doc.email,
                                name: name,
                                email: doc.email,
                                documents: doc.documents,
                                videos: doc.videos,
                                questions: doc.questions
                            };
                            mailer.sendTrackInfo(data, cb);
                        }, function (err) {
                            if (err) {
                                return waterfallCb(err)
                            }
                            waterfallCb(null, docs);
                        });
                    },

                    //update 'isSent' field to 'true'
                    function (tracks, waterfallCb) {
                        TrackModel.update(conditions, update, {multi: true}, function (err) {
                            if (err) {
                                return waterfallCb(err);
                            }
                            waterfallCb(null);
                        });
                    }],
                function (err) {
                    if (err) {
                        return console.error(err);
                    }
                    console.log('Notifications successfully sent');
                });
        }); //cronJob


        //==============================================================================================================
        var cronJobWeekly = NodeCronTab.scheduleJob('0 8 * * 6 *', function () { //production every saturday at 8 am
        //var cronJobWeekly = NodeCronTab.scheduleJob('0 0 */2 * * *', function () { // every 10 sec
            console.log('weekly report start');
            var now = new Date(Date.now());
            var to = new Date(now.setHours(24));
            var from = new Date(moment(to).subtract(7, 'days').format());
            console.log(to);
            console.log(from);

            ContentModel.find({}, function (err, docs) {
                if (err) {
                    return console.error(err);
                }
                async.each(docs, function (doc, eachCb) {
                    async.parallel({
                        visits: function (parallelCb) {
                            analytic.totalVisits(doc.ownerId.toString(), from, to, parallelCb);
                        },
                        videos: function (parallelCb) {
                            analytic.video(doc.ownerId.toString(), from, to, parallelCb);
                        },
                        questions: function (parallelCb) {
                            analytic.question(doc.ownerId.toString(), from, to, parallelCb);
                        },
                        documents: function (parallelCb) {
                            analytic.document(doc.ownerId.toString(), from, to, parallelCb);
                        }
                    }, function (err, options) {
                        if (err) {
                            return console.error(err);
                        }
                        options.companyName = doc.name;
                        options.companyEmail = doc.email;
                        options.companyLogo = doc.logoUri;
                        mailer.sendWeeklyAnalytic(options, eachCb)
                    });
                }, function (err) {
                    if (err) {
                        return console.error(err);
                    }
                    console.log('Notifications successfully sent');
                });
            });
        });
    };
};

module.exports = Schedule;
