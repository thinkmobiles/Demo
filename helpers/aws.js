/**
 * Created by Roman on 06.01.2015.
 */
var AWS = require('aws-sdk');
var fs = require('fs');
var async = require('async');

AWS.config.update({region: 'us-west-2'});
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
            return putObject(bucket, key, body, callback);
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

        this.moveDir = function (bucket, oldPrefix, newPrefix, callback) {
            var self = this;
            s3.listObjects({Bucket: bucket, Prefix: oldPrefix}, function (err, data) {
                if (err) {
                    return callback(err, null);
                } else if (!data.Contents.length) {
                    return callback(null);
                }
                async.each(data.Contents, function (file, eachCb) {
                    var params = {
                        Bucket: bucket,
                        CopySource: bucket + '/' + file.Key,
                        Key: file.Key.replace(oldPrefix, newPrefix)
                    };

                    s3.copyObject(params, function (copyErr) {
                        if (copyErr) {
                            return eachCb(copyErr);
                        }
                        console.log('Copied: ', params.Key);
                        eachCb(null);
                    });
                }, function (err, data) {
                    if (callback && (typeof callback === 'function')) {
                        if (err) {
                            return callback(null);
                        }
                        self.removeDir(bucket, oldPrefix);
                        callback(null, data);
                    }
                });

            });
        };

        this.removeDir = function (bucket, prefix, callback) {
            s3.listObjects({Bucket: bucket, Prefix: prefix}, function (err, data) {
                if (err) {
                    if (callback && (typeof callback === 'function')) {
                        return callback(err, null);
                    }
                    return console.error(err);
                } else if (!data.Contents.length) {
                    if (callback && (typeof callback === 'function')) {
                        return callback(null);
                    }
                    return;
                }
                async.each(data.Contents, function (elem, eachCb) {
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