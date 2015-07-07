/**
 * Created by Ivan on 15.06.2015.
 */
'use strict';

module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var trackSchema = mongoose.Schema({
        userId: {type: ObjectId, ref: 'Prospect'},
        contentId: {type: ObjectId, ref: 'Content'},
        firstName: {type: String},
        lastName: {type: String},
        isSent: {type: Boolean, default: false},

        questions: [{
            _id: false,
            question: {type: String},
            item: {type: String, enum: ['not', 'somewhat', 'very']}
        }],

        videos: [{
            _id: false,
            video: {type: String},
            rangeWatched: [{
                _id: false,
                start: {type: Number},
                end: {type: Number}
            }],
            howMuchWatched: {type: Number}
        }],

        documents: [
            {
                _id: false,
                document: {type: String}
            }
        ],


        createdAt: {type: Date, default: Date.now},
        updatedAt: {type: Date, default: Date.now}
    }, {collection: 'Tracks'});

    trackSchema.pre('update', function () {
        this.update({$set: {updatedAt: Date.now()}});
    });

    mongoose.model('Track', trackSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas['Track'] = trackSchema;

    if (process.env.NODE_ENV !== 'production') {
        trackSchema.set('autoIndex', false);
    }

})();