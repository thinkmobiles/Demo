'use strict';

module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var surveySchema= new mongoose.Schema({
        question: {type: String},
        order: {type:Number},
        videoUri: {type: String},
        pdfUri: [{type: String}]
    },{versionKey: false/*, _id: false*/});

    var contentSchema = mongoose.Schema({
        nameOfCampaign: {type: String},

        ownerId: {type: ObjectId, ref: 'User'},
        creatorId: {type: ObjectId, ref: 'User'},
        name: {type: String/*, required: true, unique: true*/},
        phone: {type: String},
        email: {type: String},

        logoUri: {type: String},
        mainVideoName: {type: String},
        mainVideoDescription: {type: String},
        mainVideoUri: { type: String},

        survey: [surveySchema],

        createdAt: {type: Date, default: Date.now},
        updatedAt: {type: Date, default: Date.now}
    }, {collection: 'Content'});

    mongoose.model('Content', contentSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas['Content'] = contentSchema;

    if (process.env.NODE_ENV !== 'production') {
        contentSchema.set('autoIndex', false);
    }

})();