'use strict';

module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var surveySchems= new mongoose.Schema({
        question: {type: String},
        videoUri: {type: String},
        pdfUri: [{type: String}]
    },{versionKey: false, _id: false});

    var contentSchema = mongoose.Schema({
        ownerId: {type: ObjectId, required: true, unique: true, ref: 'User'},
        name: {type: String/*, required: true, unique: true*/},
        logoUri: {type: String},
        contactMeInfo: {type: String},

        mainVideoName: {type: String},
        mainVideoDescription: {type: String},
        mainVideoUri: { type: String},

        survey: [surveySchems],
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