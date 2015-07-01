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

          userId: {type: String},
          contentId: {type: String},
        questions:[{
            _id: false,
            question: {type: String},
            item: {type: String, enum: ['not', 'somewhat', 'very']}
        }],
        videos: [{
            _id: false,
            video: {type: String},
            rangeWatched: [{
                start:{ type: Number},
                end: { type: Number}
            }],
            howMuchWatched: { type: Number}
        }],
       documents:[
           {   _id: false,
               document: { type: String} }
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