define([
    'router',
    'communication',
    'custom'
], function (Router, Communication, Custom) {

    // start application
    var initialize = function () {
        var appRouter;
        App.sessionData = new Backbone.Model({
            authorized: false,
            role: null,
            user: null,
            contentId: null,
            date: null
        });
        App.slider = [];
        // create router
        appRouter = new Router();

        // append router to global scope
        App.router = appRouter;
        App.router.on("route", function(route, params) {
            //console.log("Different Page: " + route);
            $('html, body').animate({scrollTop: 0}, 'medium');
        });
        // start tracking the history
        Backbone.history.start({silent: true});

        //Custom.navigateToLastUrl();

        // check login an then set first rout
        Communication.checkLogin(Custom.runApplication);

    };
    return {
        initialize: initialize
    }
});
