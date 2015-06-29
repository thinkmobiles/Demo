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
            "upload"                     :  "upload",
            "home(/:videoId/:userId)"           :  "home",
            "registration"              :  "registration",
            "*any"                      :  "any"
        },

        needAuthorize: [
            'upload',
            'main'


        ],

        redirectWhenAuthorize: [
            'registration'
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
			var self = this;
            // show only permitted pages
            if (!App.sessionData.get('authorized')) {
                // access only authorized views
                WrongRout = _.find(this.needAuthorize, function (rout) {
                    if (name === rout) {
                        return true
                    }
                });
                if (WrongRout) {
                    return Backbone.history.navigate("#/home", {trigger: true});
                }
            } else {
                // access not authorized views

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
        upload: function () {
            this.loadWrapperView('login');
        },
        registration: function () {
            this.loadWrapperView('registration');
        },
        home: function (videoId, userId) {
            this.loadWrapperView('home',{videoId:videoId, userId:userId});
        }
    });

    return appRouter;
});
