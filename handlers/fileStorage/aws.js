/**
 * Created by Roman on 06.01.2015.
 */
var AWS = require('aws-sdk');
var fs = require('fs');
AWS.config.update({ region: 'us-west-2' });
var async = require('async');
AWS['accessKeyId'] = process.env.AMAZON_ACCESS_KEY_ID;
AWS['secretAccessKey'] = process.env.AMAZON_SECRET_ACCESS_KEY;
var s3 = new AWS.S3({ httpOptions: { timeout: 50000 } });
//var s3policy = require('s3policy');

AWS['awsRootUrl'] = 's3.amazonaws.com';
AWS['bucketName'] = 'demo-rocket-v2';
AWS['avatarBucketName'] = 'trill_avatars';

var utc = Date.UTC(2030, 3, 1);
var now = new Date();
var delta = 24 * 60 * 60 * 1000;
AWS['imageExpiry'] = new Date(now + delta);
AWS['avatarExpiry'] = new Date(utc);
var INVALID_BASE64_STRING = process.env.INVALID_BASE64_STRING || "Invalid base64 string";

module.exports = function(protoObject) {
    "use strict";

    var Aws = function() {
        var self = this;
        var defaultOptions = {

        };

        function putObject(bucket, key, body, callback) {
            s3.putObject({ Bucket: bucket, Key: key, Body: body, ACL: 'public-read'}, function (err, data) {
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
        
        this.postBuffer = function(bucket, key, body, callback) {
            s3.putObject({ Bucket: bucket, Key: key, Body: body, ACL: 'public-read'}, function (err, data) {
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

        // This URL will expire in one minute (60 seconds)
        var params = {Bucket: 'myBucket', Key: 'myKey', Expires: 3600};
        var url = s3.getSignedUrl('getObject', params);
        console.log("The URL is", url);

        this.getFileUrl = function (options, callback ) {
            var params = {Bucket: options.bucket, Key: options.key};
            var url = s3.getSignedUrl('getObject', params);
            callback(null,url);
        };

        this.postFile = function ( folderName, fileNameOrBase64String, options, callback ) {
            var validBase64;
            var data = options.data;
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
                if (err) { throw err; }
            });
            fileStream.on('open', function () {
                return putObject(folderName, fileNameOrBase64String, fileStream, callback);
            });
        };

        this.removeFile = function ( bucket, key, callback ) {
            s3.deleteObject({ Bucket: bucket, Key: key}, function (err, data) {
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

        this.listFiles = function ( folderName, fileName, callback ) {
            s3.listObjects({ Bucket: folderName, Prefix: '562df14d680008701f000001/survey1/pdf/MacBook_UsersGuide.png'}, function (err, data) {
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