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
            "click #menu-toggle": "toggleMenu",
            "click li a": "hideMenu"

        },

        initialize: function () {
            // keep menu actual
            this.listenTo(App.sessionData, 'change:authorized', this.render);
            this.render();
        },

        hideMenu: function () {
            var self = this;
            this.$el.find('#menu-toggle').removeClass('open', function () {
                self.$el.find('#main-menu').fadeOut( 300, "linear")
            });
        },

        toggleMenu: function () {
            var self = this;
                this.$el.find('#menu-toggle').toggleClass('open', function () {
                    self.$el.find('#main-menu').fadeToggle( 300, "linear")
                });

        },

        toTop: function () {
            $('html, body').animate({scrollTop: 0}, 'medium');
        },

        toPage: function () {
            $("body").removeClass("withLogin");
        },

        login: function (e) {
            e.stopPropagation();
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
