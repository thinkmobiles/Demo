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
            admin: false,
            user: null,
            date: null,
            tariffPlans: null
        });

        // create router
        appRouter = new Router();

        // append router to global scope
        App.router = appRouter;

        // start tracking the history
        Backbone.history.start({silent: true});

        // check login an then set first rout
        Communication.checkLogin(function(err, data){
            Custom.runApplication(err, data);
        });

    };
    return {
        initialize: initialize
    }
});
