var NodeCronTab = require('node-crontab');
var mongoose = require('mongoose');
var async = require('async');

var Schedule = function (db) {
    var trackSchema = mongoose.Schemas['Track'];
    var TrackModel = db.model('Track', trackSchema);

    var contentSchema = mongoose.Schemas['Content'];
    var ContentModel = db.model('Content', contentSchema);
    var mailer = require('./mailer');

    this.runSchedule = function () {
        var cronJob = NodeCronTab.scheduleJob('0 0 */2 * * *', function () { //production every 2 hours
        //var cronJob = NodeCronTab.scheduleJob('*/10 * * * * *', function () { //every 2 minutes
            var hour = 60 * 60 * 1000;
            var time = new Date(Date.now() - 2*hour);
            var conditions = {
                'isSent': false,
                'updatedAt': {$lte: time}
            };
            var update = {
                isSent: true
            };

            TrackModel.find(conditions, function (err, tracks) {
                if (err) {
                    return console.error(err);
                }
                async.each(tracks, function (track, eachCb) {
                    if(!track.firstName || !track.lastName || !track.email){
                        TrackModel.findOne({userId: track.userId}, function (err, doc) {
                            if(err) {
                                return eachCb(err);
                            }
                            track.firstName = doc.firstName;
                            track.lastName = doc.lastName;
                            track.email = doc.email;
                            eachCb(null);
                        })
                    }
                }, function (err) {
                        if(err){
                            return console.error(err);
                        }

                    console.log('tracks at ' + new Date(Date.now()));
                    console.log(tracks);
                    if (!tracks.length) {
                        var error = new Error();
                        error.message = 'No data to send';
                        return console.error(error);
                    }

                    ContentModel.populate(tracks, {path: 'contentId'}, function (err, docs) {
                        if (err) {
                            return console.error(err);
                        }
                        async.each(docs, function (doc, cb) {
                            var name = doc.firstName + ' ' + doc.lastName;
                            var data = {
                                companyName: doc.contentId.name,
                                companyEmail: doc.contentId.email,
                                name: name,
                                email: doc.email,
                                documents: doc.documents,
                                videos: doc.videos,
                                questions: doc.questions
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
                            }); //TrackModel.update
                        }); //  async.each(docs
                    }); // ContentModel.populate
                }); // async.each(tracks
            }); // TrackModel.find
        }); //cronJob
    };
};

module.exports = Schedule;