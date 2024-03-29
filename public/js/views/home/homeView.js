define([
    'text!templates/home/homeTemplate.html',
    'custom'
], function (HomeTemplate, Custom) {

    var View;

    View = Backbone.View.extend({
        className: "mainPage",
        el: "#wrapper",
        events: {
            "click .showModal": "showModal",
            "click .showMain": "showMain",
            "click .checkbox": "checkboxClick",
            "click .registration": "hideBlur",
            "click .lock.active": "login",
            "click .whatSay .arrows .arrow-left": "prevSlide",
            "click .whatSay .arrows .arrow-right": "nextSlide",
            "click .advertising .arrows .arrow-left": "prevAdvertising",
            "click .advertising .arrows .arrow-right": "nextAdvertising",
            "keyup .signIn .userName": "changeFieldUsername",
            "keyup .signIn .password": "changeField",
            'click .login': 'loginBtn',
            "click .circles ul li": "showSlideAdvertising"
        },


        initialize: function (options) {
            var self = this;

            this.options = options;
            this.videoId = options && options.videoId ? options.videoId : "";
            this.userId = options && options.userId ? options.userId : "";
            this.modal = null;
            this.render();
            $(window).on("resize", _.debounce(function () {
                return self.updateCSS.call(self);
            }, 500));
        },

        updateCSS: function () {
            var self = this;

            if (App.slider['advertising']) {
                clearInterval(App.slider['advertising']);
            }
            if (window.innerWidth <= 700) {
                App.slider['advertising'] = setInterval(function () {
                    self.nextAdvertising()
                }, 5000);
            }
        },

        loginBtn: function (e) {
            e.stopPropagation();
            $("body").addClass("withLogin");
            setTimeout(function () {
                $(".signIn .username .userName")[0].focus();
            }, 550);
        },

        toTop: function () {
            $('html, body').animate({scrollTop: 0}, 'fast');
        },

        prevSlide: function (e) {
            if (e && App.slider['message']) {
                clearInterval(App.slider['message']);
            }
            var self = this;
            var count = this.$el.find(".messages .item").length;
            var n = this.$el.find(".messages .item").index(this.$el.find(".messages .item.selected"));
            this.$el.find(".messages .item.selected").stop().animate({
                opacity: 0
            }, 300, function () {
                $(this).removeClass("selected").css({opacity: 1});
                var k = 0;
                if (!n) {
                    k = count - 1
                } else {
                    k = n - 1
                }
                self.$el.find(".messages .item").eq(k).addClass("selected").css({opacity: 0}).stop().animate({
                    opacity: 1
                }, 300, function () {
                });
            })
        },

        nextSlide: function (e) {
            if (e && App.slider['message']) {
                clearInterval(App.slider['message']);
            }
            var self = this;
            var count = this.$el.find(".messages .item").length;
            var n = this.$el.find(".messages .item").index(this.$el.find(".messages .item.selected"));
            this.$el.find(".messages .item.selected").stop().animate({
                opacity: 0
            }, 300, function () {
                $(this).removeClass("selected").css({opacity: 1});
                var k = 0;
                if (n === count - 1) {
                    k = 0
                } else {
                    k = n + 1
                }
                self.$el.find(".messages .item").eq(k).addClass("selected").css({opacity: 0}).stop().animate({
                    opacity: 1
                }, 300, function () {
                });
            })
        },

        showSlideAdvertising: function (e) {
            if (App.slider['advertising']) {
                clearInterval(App.slider['advertising']);
            }
            var self = this;
            this.$el.find(".advertising .item.selected").stop().animate({
                opacity: 0
            }, 300, function () {
                $(this).removeClass("selected").css({opacity: 1});
                var k = self.$el.find(".circles ul li").index($(e.target));
                self.$el.find(".circles li").removeClass('selected').eq(k).addClass("selected");
                self.$el.find(".advertising .item").eq(k).addClass("selected").css({opacity: 0}).stop().animate({
                    opacity: 1
                }, 300, function () {
                });
            })
        },

        prevAdvertising: function (e) {
            if (App.slider['advertising']) {
                clearInterval(App.slider['advertising']);
            }
            var self = this;
            var count = this.$el.find(".advertising .item").length;
            var n = this.$el.find(".advertising .item").index(this.$el.find(".advertising .item.selected"));
            this.$el.find(".advertising .item.selected").stop().animate({
                opacity: 0
            }, 300, function () {
                $(this).removeClass("selected").css({opacity: 1});
                var k = 0;
                if (!n) {
                    k = count - 1
                } else {
                    k = n - 1
                }
                self.$el.find(".circles li").removeClass('selected').eq(k).addClass("selected");
                self.$el.find(".advertising .item").eq(k).addClass("selected").css({opacity: 0}).stop().animate({
                    opacity: 1
                }, 300, function () {
                });
            })
        },

        nextAdvertising: function (e) {
            if (e && App.slider['advertising']) {
                clearInterval(App.slider['advertising']);
            }
            var self = this;
            var count = this.$el.find(".advertising .item").length;
            var n = this.$el.find(".advertising .item").index(this.$el.find(".advertising .item.selected"));
            this.$el.find(".advertising .item.selected").stop().animate({
                opacity: 0
            }, 300, function () {
                $(this).removeClass("selected").css({opacity: 1});
                var k = 0;
                if (n === count - 1) {
                    k = 0
                } else {
                    k = n + 1
                }
                self.$el.find(".circles li").removeClass('selected').eq(k).addClass("selected");
                self.$el.find(".advertising .item").eq(k).addClass("selected").css({opacity: 0}).stop().animate({
                    opacity: 1
                }, 300, function () {
                });
            })
        },

        changeField: function (e) {
            var self = this;
            if (e.keyCode === 13) {
                self.$el.find(".lock.active").click();
            }
            if (self.$el.find(".signIn .userName").val()) {
                self.$el.find(".signIn .username .inp").addClass("valid");
            } else {
                self.$el.find(".signIn .username .inp").removeClass("valid");
            }
            if (self.$el.find(".signIn .password").val()) {
                self.$el.find(".signIn .pass .inp").addClass("valid");
            } else {
                self.$el.find(".signIn .pass .inp").removeClass("valid");
            }
            if (self.$el.find(".signIn .userName").val() && self.$el.find(".signIn .password").val()) {
                self.$el.find(".lock").addClass("active");
            } else {
                self.$el.find(".lock").removeClass("active");
            }
        },

        showAvatar: _.debounce(function () {

            var self = this;
            $.ajax({
                url: "/avatar/" + self.$el.find(".signIn .userName").val().toLowerCase(),
                type: "GET",
                dataType: 'json',
                success: function (response) {
                    if (response.avatar) {
                        self.$el.find(".signIn .ava img").attr("src", response.avatar);
                    } else {
                        self.$el.find(".signIn .ava img").attr("src", Custom.defaultImage);
                    }
                },
                error: function (err) {
                    self.$el.find(".signIn .ava img").attr("src", Custom.defaultImage);
                }
            });
        }, 300),

        changeFieldUsername: function (e) {
            this.changeField(e);
            this.showAvatar();
        },

        hideBlur: function (e) {
            $("body").removeClass("withLogin");
        },

        checkboxClick: function (e) {
            $(e.target).closest(".checkbox").toggleClass("checked");
        },

        showModal: function () {
            if (this.options && this.options.videoId && this.options.userId) {
                Backbone.history.navigate("#/chooseViewer/" + this.videoId + "/" + this.userId, {trigger: true});
                if(this.options.userId ==='{{ctid}}'){
                    Backbone.history.navigate("#/registerViewer/"+this.videoId+"/new", {trigger: true});
                    return;
                }
            } else  if (this.options && this.options.videoId) {
                Backbone.history.navigate("#/registerViewer/" + this.videoId, {trigger: true});
            }else{
                Backbone.history.navigate("#/watchVideo", {trigger: true});
            }
        },

        showMain: function () {
            Backbone.history.navigate("#/watchVideo", {trigger: true});
        },

        login: function (e) {
            var self = this;
            var keepAlive = self.$el.find(".signIn .checkbox").hasClass("checked");
            $.ajax({
                url: "/login",
                type: "POST",
                dataType: 'json',
                data: {
                    keepAlive: keepAlive,
                    userName: self.$el.find(".signIn .userName").val().toLowerCase(),
                    pass: self.$el.find(".signIn .password").val()
                },
                success: function (response) {
                    $("body").removeClass("withLogin");
                    self.$el.find(".signIn .userName").removeClass("error");
                    self.$el.find(".signIn .password").removeClass("error");
                    App.updateUser(function () {
                        Backbone.history.navigate("#/login", {trigger: true})
                    });
                },
                error: function (err) {
                    self.$el.find(".signIn .username .inp").addClass("error");
                    self.$el.find(".signIn .pass .inp").addClass("error");
                    App.notification(err.responseJSON.error);
                }
            });
        },

        render: function () {
            var self = this;
            this.$el.html(_.template(HomeTemplate));
            if (this.options && this.options.videoId && this.options.userId) {
                if(this.options.userId ==='{{ctid}}'){
                    Backbone.history.navigate("#/registerViewer/"+this.videoId+"/new", {trigger: true});
                    return;
                }
                if (!this.options.showedModal) {
                    Backbone.history.navigate("#/chooseViewer/" + this.videoId + "/" + this.userId, {trigger: true});
                }
                $(".showModal").attr("href", "#/chooseViewer/" + this.videoId + "/" + this.userId);
            }
            this.updateCSS();

            if (App.slider['message']) {
                clearInterval(App.slider['message']);
            }
            App.slider['message'] = setInterval(function () {
                self.nextSlide()
            }, 5000);

            return this;
        }


    });
    return View;
});
