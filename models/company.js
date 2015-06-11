'use strict';

module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var videoSchema= new mongoose.Schema({
        uri: {type: String, required: true},
        question: {type: String, required: true},
        pdf: {
            name: {type: String, required: true},
            uri: {type: String, required: true}
        }
    },{versionKey: false, _id: false});

    var companySchema = mongoose.Schema({
        name: {type: String, required: true, unique: true},
        logoUri: {type: String},
        mainVideo: {
            uri: { type: String},
            description: {type: String}
        },
        additionalVideo: [videoSchema],
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