/**
 * Created by Ivan on 15.06.2015.
 */
'use strict';

module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var trackSchema = mongoose.Schema({
        jumpleadId: {type: String},
        contentId: {type: ObjectId, ref: 'Content'},
        firstName: {type: String},
        lastName: {type: String},
        email: {type: String},
        domain: {type: String},
        isNewViewer: {type: Boolean, default: false},
        isSent: {type: Boolean, default: false},

        questTime: {type: Date, default: Date.now},
        questions: [{
            _id: false,
            question: {type: String},
            item: {type: String, enum: ['not', 'somewhat', 'very']}
        }],

        videos: [{
            _id: false,
            time: {type: Date, default: Date.now},
            video: {type: String},
            stopTime: {type: String},
            end: {type: Boolean, default: false}
        }],

        documents: [{
                _id: false,
                time: {type: Date, default: Date.now},
                document: {type: String}
            }],

        createdAt: {type: Date, default: Date.now},
        updatedAt: {type: Date, default: Date.now}
    }, {collection: 'Tracks'});

    mongoose.model('Track', trackSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas['Track'] = trackSchema;

    if (process.env.NODE_ENV !== 'production') {
        trackSchema.set('autoIndex', false);
    }

})();