define([
    'text!templates/menu/topMenuTemplate.html'
], function (topMenuTemplate) {

    var View;
    View = Backbone.View.extend({
        el: '#topMenu',

        events: {
            'click #logOut': 'logout',
            'click .login': 'login',
            'click .navBar': 'toPage',
            "click #menu-toggle,#main-menu": "toggleMenu",
            "click #toggle-wrapper a": "hideMenu"

        },

        initialize: function () {
            // keep menu actual
            this.listenTo(App.sessionData, 'change:authorized', this.render);
            this.listenTo(App.sessionData, 'change:role', this.render);
            this.listenTo(App.sessionData, 'change:user', this.render);
            this.listenTo(App.sessionData, 'change:campaigns', this.render);
            this.render();
        },

        hideMenu: function () {
            if (window.innerWidth <= 736) {
                var self = this;
                this.$el.find('.toggle-wrapper').removeClass('open', function () {
                    self.$el.find('#main-menu').slideUp(500, "swing");
                });
            }
        },

        toggleMenu: function () {
            if (window.innerWidth <= 736) {
                var self = this;
                this.$el.find('.toggle-wrapper').toggleClass('open', function () {
                    self.$el.find('#main-menu').slideToggle(500, "swing")
                });
            }
        },

        toPage: function () {
            $("body").removeClass("withLogin");
            if (this.modalView) {
                this.modalView.undelegateEvents();
            }
        },

        login: function (e) {
            e.stopPropagation();
            this.toggleMenu();
            $("body").addClass("withLogin");
            if (this.modalView) {
                this.modalView.undelegateEvents();
            }
            if (window.innerWidth <= 736) {
                $(document).find('#wrapper').css({'display': 'block'});
                $(document).find('#footer').css({'display': 'block'});
            }
            $(".ui-dialog").remove();
            setTimeout(function () {
                $(".signIn .username .userName")[0].focus();
            }, 550);

        },


        render: function () {
            this.$el.html(_.template(topMenuTemplate)({
                authorized: App.sessionData.get("authorized"),
                role: App.sessionData.get("role"),
                campaigns: App.sessionData.get("campaigns")||[],
                user: App.sessionData.get("user")
            }));
            return this;
        }
    });
    return View;
});
