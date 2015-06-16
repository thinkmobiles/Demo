/**
 * Created by Ivan on 15.06.2015.
 */
'use strict';

module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

      var trackSchema = mongoose.Schema({
          //userId: {type: ObjectId, required: true, unique: true},
          //companyId: {type: ObjectId, unique: true},

          userId: {type: String, required: true, unique: true},
          companyId: {type: String, unique: true},
        questions:[{
            _id: false,
            questionId: {type: String},
            item: {type: String, enum: ['not', 'somewhat', 'very']}
        }],
        videos: [{
            _id: false,
            videoId: {type: String},
            rangeWatched: [{
                start:{ type: Number},
                end: { type: Number}
            }],
            howMuchWatched: { type: Number}
        }],
       documents:[
           {   _id: false,
               documentId: { type: String} }
       ],


        createdAt: {type: Date, default: Date.now},
        updatedAt: {type: Date, default: Date.now}
    }, {collection: 'Tracks'});

    trackSchema.pre('update', function() {
        this.update({ $set: { updatedAt: Date.now() } });
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