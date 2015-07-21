'use strict';

process.env.HOST = 'http://127.0.0.1:8838';
process.env.WEB_HOST = 'http://127.0.0.1:8838';
process.env.PORT = 8838;
//process.env.HOST = 'http://localhost:8838';
//process.env.PORT = 8838;
//process.env.DB_HOST = '192.168.88.250';
process.env.DB_HOST = '127.0.0.1'; //local
process.env.DB_NAME = 'rocketDB';
process.env.CLIENT_SECRET = "sCkxGw1dWL4j1QrOnNmT6ZOv9feBqFhUbe1uTg4Y";
process.env.CLIENT_ID = "FcDOCBsnZ2TtKbHTGULY";
process.env.REDIRECT_URI = "http://demo.com:8838/redirect";
process.env.HOME_PAGE = "http://demo.com:8838/#/home/";

process.env.mailerService = 'Gmail';
process.env.mailerUserName = "gogi.gogishvili";
process.env.mailerPassword = "gogi123456789";