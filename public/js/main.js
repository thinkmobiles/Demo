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
        Underscore: './libs/underscore/underscore-min',
        Backbone: './libs/backbone/backbone-min',
        less: './libs/less/dist/less.min',
        templates: '../templates', // templates dir not error
        text: './libs/text/text',
        common: 'common'
    },
    shim: {
        'ajaxForm': ['jQuery'],
        'Bootstrap': ['jQuery'],
        'Backbone': ['Underscore', 'jQuery'],
        'app': ['Backbone', 'less']
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
                    App.sessionData.set({
                        authorized: false,
                        user: null
                    });
                } else {
                    alert("You do not have permission to perform this action");
                }
            } else {
                if (xhr.responseJSON) {
                    alert(xhr.responseJSON.error);
                } else if (xhr.message) {
                    alert(xhr.message);
                } else {
                    console.error(xhr);
                }
            }
        }
    };

    App.updateUser = function () {  //update user data when subscription is change
        $.ajax({
            url: "/currentUser",
            type: "GET",
            success: function (data) {
                App.sessionData.set({
                    user: data
                })
            },
            error: function (data) {
                App.error(data);
            }
        });
    };


    app.initialize();
});
