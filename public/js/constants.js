/**
 * Created by john on 01.12.15.
 */
define([], function () {

    var production, local, development;

    production = {
        //thinkmobiles server
        JUMPLEAD_AUTHORIZE_URL: 'https://account.mooloop.com/oauth/authorize?response_type=code&client_id=S2aUNWlBd2HRMKsQzZqW&redirect_uri=http://projects.thinkmobiles.com:8838/redirect&scope=jumplead.contacts,jumplead.personal',
        PRODUCTION_HOST: 'http://demorocket.biz',
        FB_SHARE_CAPTION: 'DEMOROCKET.BIZ',
        FB_SHARE_NAME: 'DemoRocket Video',
        IN_SHARE_NAME: 'DemoRocket Video'

    };

    development = {
        //local server
        JUMPLEAD_AUTHORIZE_URL: 'https://account.mooloop.com/oauth/authorize?response_type=code&client_id=S2aUNWlBd2HRMKsQzZqW&redirect_uri=http://projects.thinkmobiles.com:8838/redirect&scope=jumplead.contacts,jumplead.personal',
        PRODUCTION_HOST: 'http://projects.thinkmobiles.com:8838',
        FB_SHARE_CAPTION: 'DEMOROCKET.BIZ',
        FB_SHARE_NAME: 'DemoRocket Video',
        IN_SHARE_NAME: 'DemoRocket Video'
    };

    local = {
        //local server
        JUMPLEAD_AUTHORIZE_URL: 'https://account.mooloop.com/oauth/authorize?response_type=code&client_id=uemnB2ZAA92gv5CoTCHc&redirect_uri=http://localhost:8838/redirect&scope=jumplead.contacts,jumplead.personal',
        PRODUCTION_HOST: 'http://localhost:8838',
        FB_SHARE_CAPTION: 'DEMOROCKET.BIZ',
        FB_SHARE_NAME: 'DemoRocket Video',
        IN_SHARE_NAME: 'DemoRocket Video'
    };

    //ToDo: use production
    //return production;

    return development;
});