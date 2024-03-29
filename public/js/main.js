var App = {
    //File: {
    //    MAXSIZE: 10485760,  //size in kilobytes  = 3 MB
    //    MaxFileSizeDisplay: "10 MB"
    //},
    //requestedURL: null,
    //Calendar: {
    //    currentCalendarId: ""
    //}
};

require.config({
    paths: {
        jQuery: './libs/jquery/dist/jquery.min',
        jQueryUI: './libs/jqueryui/jquery-ui.min',
        Underscore: './libs/underscore/underscore-min',
        Backbone: './libs/backbone/backbone-min',
        mCustomScrollbar: './libs/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.concat.min',
        less: './libs/less/dist/less.min',
        d3: './libs/d3/d3.min',
        moment: './libs/moment/min/moment.min',
        templates: '../templates', // templates dir not error
        text: './libs/text/text',
        common: 'common',
        constants: './constants',
        clipboard: "./libs/clipboard/dist/clipboard.min"

    },
    shim: {
        'ajaxForm': ['jQuery'],
        'Backbone': ['Underscore', 'jQuery'],
        'jQueryUI': ['jQuery'],
        'mCustomScrollbar': ['jQuery'],
        'app': ['Backbone', 'less', 'jQueryUI', 'mCustomScrollbar']
    }
});

require(['app'], function (app) {

    // global error handler
    App.error = function (xhr) {
        if (xhr) {
            if (xhr.status === 401 || xhr.status === 403) {
                if (xhr.status === 401) {
                    if (App.sessionData.get('authorized')) {
                        Backbone.history.navigate("login", {trigger: true});
                    }
                    App.notification("Your session has expired. Please log in again");
                    App.sessionData.set({
                        authorized: false,
                        user: null,
                        campaigns: null
                    });
                } else {
                    App.notification("You do not have permission to perform this action");
                }
            } else {
                if (xhr.responseJSON) {
                    App.notification(xhr.responseJSON.error);
                } else if (xhr.message) {
                    App.notification(xhr.message);
                } else {
                    console.error(xhr);
                }
            }
        }
    };
    var inter = 0;
    App.notification = function (text) {
        if (inter)clearInterval(inter);
        $(".notification").show(100).text(text || "Error");
        inter = setTimeout(function () {
            $(".notification").hide(100);
        }, 5000);
    };


    var cacheContent = {};
    App.getContent = function (videoId, userId, callback) {
        if (cacheContent[videoId] && cacheContent[videoId][userId]) {
            if (callback)callback(cacheContent[videoId][userId]);
        } else {
            cacheContent[videoId] = {};
            require(["models/contentModel"], function (ContentModel) {
                var content = new ContentModel({_id: videoId, userId: userId});
                content.fetch({
                    error: function (collection, response) {
                        App.error(response);
                        console.log(response);
                    }
                });

                content.bind('change', function () {
                    cacheContent[videoId][userId] = content;
                    if (callback)callback(content);
                });
            });
        }
    };

    App.clearContent = function () {
        cacheContent = {};
    };

    App.updateUser = function (callback) {  //update user data when subscription is change
        $.ajax({
            url: "/currentUser",
            type: "GET",
            success: function (data) {
                App.sessionData.set({
                    authorized: true,
                    role: data.role,
                    user: data,
                    campaigns: data.campaigns
                });
                if (callback)callback();
            },
            error: function (data) {
                App.error(data);
                if (callback)callback(data);
            }
        });
    };


    app.initialize();
});
