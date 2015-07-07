var NodeCronTab = require('node-crontab');
var mongoose = require('mongoose');
var async = require('async');

var Schedule = function (db) {
    var trackSchema = mongoose.Schemas['Track'];
    var TrackModel = db.model('Track', trackSchema);

    var contentSchema = mongoose.Schemas['Content'];
    var ContentModel = db.model('Content', contentSchema);
    var mailer = require('../helpers/mailer');

    this.runSchedule = function () {
        //var cronJob = NodeCronTab.scheduleJob('*/20 * * * * *', function () { //test
        var cronJob = NodeCronTab.scheduleJob('* */2 * * * *', function () {
                var time = Date.now() + 2 * 60 * 60 * 1000;
                var conditions = {
                    'isSent': false,
                    'updatedAt': {gte: time}
                };
                var update = {
                    isSent: true
                };

                TrackModel.find(conditions, function (err, tracks) {
                    if (err) {
                        return console.error(err);
                    }
                    if (!tracks) {
                        var error = new Error();
                        error.message = 'No data to send';
                        return console.error(error);
                    }

                    ContentModel.populate(tracks, {path: 'contentId'}, function (err, docs) {
                        if (err) {
                            return next(err);
                        }
                        async.each(docs, function (doc, cb) {
                            var data = {
                                companyName: doc.contentId.name,
                                companyEmail: doc.contentId.email,
                                name: doc.firstName + ' ' + lastName,
                                email: doc.email,
                                documents: doc.documents,
                                videos: doc.videos,



                            };
                            mailer.sendTrackInfo(data, cb);
                        }, function (err) {
                            if (err) {
                                return console.error(err);
                            }
                            TrackModel.update(conditions, update, {multi: true}, function (err) {
                                if (err) {
                                    return console.error(err);
                                }
                                console.log('Notifications successfully sended');
                            });
                        });
                    });
                });
            });
    };
};

module.exports = Schedule;