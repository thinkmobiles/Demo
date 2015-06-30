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
        less: './libs/less/dist/less.min',
        templates: '../templates', // templates dir not error
        text: './libs/text/text',
        common: 'common'
    },
    shim: {
        'ajaxForm': ['jQuery'],
        'Bootstrap': ['jQuery'],
        'Backbone': ['Underscore', 'jQuery'],
        'jQueryUI':['jQuery'],
        'app': ['Backbone', 'less','jQueryUI']
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
	var inter = 0;
	App.notification = function(text){
		if (inter)clearInterval(inter);
		$(".notification").show(100).text(text||"Error");
		inter = setTimeout(function(){
			$(".notification").hide(100);
		},5000);
	}
	
    App.updateUser = function (callback) {  //update user data when subscription is change
        $.ajax({
            url: "/currentUser",
            type: "GET",
            success: function (data) {
                App.sessionData.set({
					authorized: true,
                    user: data
                })
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
