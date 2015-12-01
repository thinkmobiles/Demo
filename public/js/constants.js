/**
 * Created by john on 01.12.15.
 */
define([], function () {

    var production, development;

    production = {
        //thinkmobiles server
        JUMPLEAD_AUTHORIZE_URL: 'https://account.mooloop.com/oauth/authorize?response_type=code&client_id=S2aUNWlBd2HRMKsQzZqW&redirect_uri=http://projects.thinkmobiles.com:8838/redirect&scope=jumplead.contacts,jumplead.personal',
        PRODUCTION_HOST: 'http://demorocket.biz'
    };

    development = {
        //local server
        JUMPLEAD_AUTHORIZE_URL: 'https://account.mooloop.com/oauth/authorize?response_type=code&client_id=FcDOCBsnZ2TtKbHTGULY&redirect_uri=http://demo.com:8838/redirect&scope=jumplead.contacts,jumplead.personal',
        PRODUCTION_HOST: 'http://projects.thinkmobiles.com:8838'
    };

    //ToDo: use production
    //return production;

    return development;
});