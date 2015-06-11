'use strict';

module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var surveySchems= new mongoose.Schema({
        question: {type: String},

        videoName: {type: String},
        videoUri: {type: String},

        pdfName: {type: String},
        pdfUri: {type: String}
    },{versionKey: false, _id: false});

    var companySchema = mongoose.Schema({
        name: {type: String/*, required: true, unique: true*/},
        logoUri: {type: String},
        contactMeInfo: {type: String},

        mainVideoName: {type: String},
        mainVideoDescription: {type: String},
        mainVideoUri: { type: String},

        survey: [surveySchems],
        createdAt: {type: Date, default: Date.now},
        updatedAt: {type: Date, default: Date.now}
    }, {collection: 'Companies'});

    mongoose.model('Company', companySchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas['Company'] = companySchema;

    if (process.env.NODE_ENV !== 'production') {
        companySchema.set('autoIndex', false);
    }

})();