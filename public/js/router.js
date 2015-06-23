define([
    'custom',
    'views/menu/topMenuView'
], function (custom, TopMenuView) {

    var appRouter;
    appRouter = Backbone.Router.extend({

        wrapperView: null,
        mainView: null,
        topBarView: null,
        view: null,

        routes: {
            "login"                     :  "login",
            "home(/:videoId)"           :  "home",
            "registration"              :  "registration",
            "*any"                      :  "any"
        },

        needAuthorize: [
            'login',
            "billingInfo",
            "device",
            "devices",
            "profile",
            'main'


        ],

        redirectWhenAuthorize: [
            'registration',
            'forgotPassword',
            'resetPassword',
            'confirm',
			'home'
        ],

        initialize: function () {
            new TopMenuView();
			$(document).on("click", ".ui-dialog-titlebar-close", function (e) {
				$(".ui-dialog").remove();
            });
			$(document).on( 'scroll', function(){
				if ($(document).scrollTop()){
					$(".navBar").addClass("small");
				}else{
					$(".navBar").removeClass("small");
				}
			});
			
        },

        // load and create view if is exist
        loadWrapperView: function (name, params) {
            var WrongRout = null;

            // show only permitted pages
            if (!App.sessionData.get('authorized')) {
                // access only authorized views
                WrongRout = _.find(this.needAuthorize, function (rout) {
                    if (name === rout) {
                        return true
                    }
                });
                if (WrongRout) {
                    return Backbone.history.navigate("home", {trigger: true});
                }
            } else {
                // access not authorized views
			console.log(this.redirectWhenAuthorize);
				
                WrongRout = _.find(this.redirectWhenAuthorize, function (rout) {
                    if (name === rout) {
                        return true
                    }
                });
                if (WrongRout) {
                    return Backbone.history.navigate("#/home", {trigger: true});
                }
            }

            //create new view if it not created before
            var self = this;
            require(['views/' + name + '/' + name + 'View'], function (View) {
                self.changeWrapperView(new View(params));
            });
        },

        changeWrapperView: function (wrapperView) {
            if (this.wrapperView) {
                this.wrapperView.undelegateEvents();
            }

            wrapperView.delegateEvents();

            this.wrapperView = wrapperView;

            // hook
            // using for cleaning
            if (wrapperView.afterUpend) {
                wrapperView.afterUpend();
            }
        },

        main: function (page) {
            if (page) page = parseInt(page);
            this.loadWrapperView('main', {
                page: page,
                modal: false
            });
        },
        any: function () {
            this.loadWrapperView('home');
        },
        login: function () {
            this.loadWrapperView('login');
        },
        forgotPassword: function () {
            this.loadWrapperView('forgotPassword');
        },
        registration: function () {
            this.loadWrapperView('registration');
        },
        termsAndConditions: function () {
            this.loadWrapperView('termsAndConditions');
        },
        contactUs: function () {
            this.loadWrapperView('contactUs');
        },
        home: function (videoId) {
            this.loadWrapperView('home',{videoId:videoId});
        },
        profile: function () {
            this.loadWrapperView('profile');
        },
        billingInfo: function (subscribe) {
            this.loadWrapperView('billingInfo', {
                subscribe: subscribe
            });
        },
        devices: function (page) {
            if (page) page = parseInt(page);
            this.loadWrapperView('devices', {page: page});
        },
        /*device: function (id) {
            this.loadWrapperView('device', {id: id});
        },*/
        resetPassword: function (token) {
            this.loadWrapperView('resetPassword', {token: token});
        },
        confirm:function(){
            this.loadWrapperView('confirm');
        },
        confirmEmail:function(token){
            this.loadWrapperView('confirmEmail', {token: token});
        }

    });

    return appRouter;
});
