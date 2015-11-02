/**
 * Created by Roman on 06.01.2015.
 */
var AWS = require('aws-sdk');
var fs = require('fs');
var async = require('async');

AWS.config.update({region: 'su-west-2'});
AWS['accessKeyId'] = process.env.AMAZON_ACCESS_KEY_ID;
AWS['secretAccessKey'] = process.env.AMAZON_SECRET_ACCESS_KEY;
var s3 = new AWS.S3({httpOptions: {timeout: 50000}});

var INVALID_BASE64_STRING = process.env.INVALID_BASE64_STRING || "Invalid base64 string";

module.exports = function (protoObject) {
    "use strict";

    var Aws = function () {
        var self = this;
        var defaultOptions = {};

        function putObject(bucket, key, body, callback) {
            s3.putObject({Bucket: bucket, Key: key, Body: body, ACL: 'public-read'}, function (err, data) {
                if (callback && (typeof callback === 'function')) {
                    if (err) {
                        console.log(err);
                        callback(err, null);
                    } else {
                        callback(null, data);
                    }
                }
            });
        };

        this.postBuffer = function (bucket, key, body, callback) {
            s3.putObject({Bucket: bucket, Key: key, Body: body, ACL: 'public-read'}, function (err, data) {
                if (callback && (typeof callback === 'function')) {
                    if (err) {
                        console.log(err);
                        callback(err, null);
                    } else {
                        callback(null, data);
                    }
                }
            });
        };

        this.getFileUrl = function (options, callback) {
            var params = {Bucket: options.bucket, Key: options.key};
            var url = s3.getSignedUrl('getObject', params);
            callback(null, url);
        };

        this.postFile = function (bucket, key, file, callback) {
            var validBase64;
            var data = file;
            var err;
            //check and if need change arguments of target method
            //==========================================================================
            //self.validateIncomingParameters(arguments);
            //==========================================================================

            //if(data) {
            //    validBase64 = self.checkBase64(data);
            //    if(validBase64) {
            //        data = self.convertFromBase64( base64 );
            //    } else {
            //        err = new Error(INVALID_BASE64_STRING);
            //        err.status = 400;
            //    }
            //}
            var fileStream = fs.createReadStream(data.path);
            fileStream.on('error', function (err) {
                if (err) {
                    throw err;
                }
            });
            fileStream.on('open', function () {
                return putObject(bucket, key, fileStream, callback);
            });
        };

        this.removeFile = function (bucket, key, callback) {
            s3.deleteObject({Bucket: bucket, Key: key}, function (err, data) {
                if (callback && (typeof callback === 'function')) {
                    if (err) {
                        console.log(err);
                        callback(err, null);
                    } else {
                        callback(null, data);
                    }
                }
            });
        };

        this.removeDir = function (bucket, prefix, callback) {
            s3.listObjects({Bucket: bucket, Prefix: prefix}, function (err, data) {
                if (err) {
                    return callback(err, null);
                } else {
                    async.eachSeries(data.Contents, function (elem, eachCb) {
                        s3.deleteObject({Bucket: bucket, Key: elem.Key}, function (err, data) {
                            if (err) {
                                return eachCb(err);
                            }
                            eachCb(null);
                        });
                    }, function (err, data) {
                        if (callback && (typeof callback === 'function')) {
                            if (err) {
                                console.log(err);
                                callback(err, null);
                            } else {
                                callback(null, data);
                            }
                        }
                    });
                }
            });
        };

        this.listFiles = function (bucket, prefix, callback) {
            s3.listObjects({Bucket: bucket, Prefix: prefix}, function (err, data) {
                if (callback && (typeof callback === 'function')) {
                    if (err) {
                        console.log(err);
                        callback(err, null);
                    } else {
                        callback(null, data);
                    }
                }
            });
        };
    };
    return Aws;
};