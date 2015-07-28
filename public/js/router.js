define([
    'custom',
    'views/menu/topMenuView'
], function (custom, TopMenuView) {

    var appRouter;
    appRouter = Backbone.Router.extend({

        wrapperView: null,
		modalView: null,
        mainView: null,
        topBarView: null,
        view: null,

        routes: {
            "upload"                    :  "upload",
            "home(/:videoId/:userId)"   :  "home",
			"chooseViewer(/:videoId/:userId)" :  "chooseViewer",
			"registerViewer(/:videoId/:userId)" :  "registerViewer",
			"contactMe(/:videoId/:userId/:page)(/:indexList)" :  "contactMe",
			"watchVideo(/:videoId/:userId)" :  "watchVideo",
			"chooseImportant(/:videoId/:userId)" :  "chooseImportant",
			"relatedVideo(/:videoId/:userId)(/:indexList)" :  "relatedVideo",
            "registration"              :  "registration",
            //ToDo: analitic )))))))))))))haha)
			"analytics"              :  "analytics",
			"users"              :  "users",
			"message?text=:text":       "showNotification",
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
			$(document).on("click", function (e) {
				if (!$(e.target).closest(".customSelect").length){
					$(".customSelect ul").hide()
				}
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
        loadWrapperView: function (name, params, callback) {
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
				if (callback)callback();
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

     showModalView: function (name, params) {
		 var self = this;
		   if (this.modalView) {
                this.modalView.undelegateEvents();
            }
            require(['views/modal/' + name + 'View'], function (View) {
				if (!self.wrapperView) {
					
					self.loadWrapperView('home',_.extend(params,{showedModal:true}),function(){
						self.modalView = new View(params);
					});
				}else{
					$(".ui-dialog").remove();
					self.modalView = new View(params);
				}

	
            });
			
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
            this.loadWrapperView('upload');
        },
		analytics: function () {
            this.loadWrapperView('analitics');
        },
		users: function () {
            this.loadWrapperView('users');
        },
        registration: function () {
            this.loadWrapperView('registration');
        },
        home: function (videoId, userId) {
            this.loadWrapperView('home',{
                videoId:videoId,
                userId:userId
            });
        },
		
		watchVideo: function (videoId, userId) {
            this.showModalView('watchVideo',{videoId:videoId, userId:userId});
        },
		
		chooseViewer: function (videoId, userId) {
            this.showModalView('chooseViewer',{videoId:videoId, userId:userId});
        },

        registerViewer: function (videoId, userId) {
            this.showModalView('registerViewer',{videoId:videoId, userId:userId});
        },
		contactMe: function (videoId, userId, page, indexList) {
            this.showModalView('contactMe',{videoId:videoId, userId:userId, page:page, indexList:indexList});
        },
		chooseImportant: function (videoId, userId) {
            this.showModalView('watchVideo',{videoId:videoId, userId:userId, page:"important"});
        },
		relatedVideo: function (videoId, userId, indexList) {
            this.showModalView('watchVideo',{videoId:videoId, userId:userId, indexList:indexList, page:"related"});
        },
		showNotification:function(text){
			console.log(text);
			Backbone.history.navigate("#/home", {trigger: true});
			App.notification(text);
		}
		

    });

    return appRouter;
});
