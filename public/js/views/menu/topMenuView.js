define([
    'text!templates/menu/topMenuTemplate.html'
], function (topMenuTemplate) {

    var View;
    View = Backbone.View.extend({
        el: '#topMenu',

        events: {
            //"click .showModal":"showModal",
            'click #logOut': 'logout',
            'click .login': 'login',
            'click .navBar': 'toPage',
            "click .topMenu": "toTop",
            "click #menu-toggle,#main-menu": "toggleMenu",
            "click #toggle-wrapper a": "hideMenu"

        },

        initialize: function () {
            // keep menu actual
            this.listenTo(App.sessionData, 'change:authorized', this.render);
            this.render();
        },

        hideMenu: function () {
            if (window.innerWidth <= 640) {
                var self = this;
                this.$el.find('.toggle-wrapper').removeClass('open', function () {
                    self.$el.find('#main-menu').slideUp(500, "swing");
                });
            }
        },

        toggleMenu: function () {
            if (window.innerWidth <= 640) {
                var self = this;
                this.$el.find('.toggle-wrapper').toggleClass('open', function () {
                    self.$el.find('#main-menu').slideToggle(500, "swing")
                });
            }
        },

        toTop: function () {
            $('html, body').animate({scrollTop: 0}, 'medium');
        },

        toPage: function () {
            $("body").removeClass("withLogin");
        },

        login: function (e) {
            e.stopPropagation();
            this.toggleMenu();
            $("body").addClass("withLogin");
            setTimeout(function () {
                $(".signIn .username .userName")[0].focus();
            }, 550);

        },


        render: function () {

            console.log(App.sessionData.get("authorized"));

            this.$el.html(_.template(topMenuTemplate)({
                authorized: App.sessionData.get("authorized"),
                admin: App.sessionData.get("admin"),
                user: App.sessionData.get("user")
            }));
            return this;
        }
    });
    return View;
});
