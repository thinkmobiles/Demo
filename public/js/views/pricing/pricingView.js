define([
    'text!templates/pricing/pricingTemplate.html'
], function (Template) {
    var View = Backbone.View.extend({

        el: "#wrapper",
        events: {
            "click .contactUs": "contact",
            "click .arrow-left": "prevSlide",
            "click .arrow-right": "nextSlide",
            "click .circles ul li": "showSlide"
        },
        initialize: function () {
            var self = this;
            this.render();
            $(window).on("resize", _.debounce(function () {
                return self.updateCSS.call(self);
            }, 500));
        },

        contact: function () {
            Backbone.history.navigate("#/contact", {trigger: true});
            $("body").removeClass("withLogin");
            $('html, body').animate({scrollTop: 0}, 'medium');
        },


        showSlide: function(e){
            if (App.slider['pricing']){
                clearInterval(App.slider['pricing']);
            }
            var self = this;
            this.$el.find(".purchasingSlider .purchasing.selected").stop().animate({
                opacity:0
            },300,function(){
                $(this).removeClass("selected").css({opacity:1});
                var k = self.$el.find(".circles ul li").index($(e.target));
                self.$el.find(".circles li").removeClass('selected').eq(k).addClass("selected");
                self.$el.find(".purchasingSlider .purchasing").eq(k).addClass("selected").css({opacity:0}).stop().animate({
                    opacity:1
                },300,function(){
                });
            })
        },

        prevSlide: function(e){
            if (e&&App.slider['pricing']){
                clearInterval(App.slider['pricing']);
            }
            var self = this;
            var count = this.$el.find(".purchasingSlider .purchasing").length;
            var n = this.$el.find(".purchasingSlider .purchasing").index(this.$el.find(".purchasingSlider .purchasing.selected"));
            this.$el.find(".purchasingSlider .purchasing.selected").stop().animate({
                opacity:0
            },300,function(){
                $(this).removeClass("selected").css({opacity:1});
                var k= 0;
                if (!n){
                    k = count-1
                }else{
                    k = n-1
                }
                self.$el.find(".circles li").removeClass('selected').eq(k).addClass("selected");
                self.$el.find(".purchasingSlider .purchasing").eq(k).addClass("selected").css({opacity:0}).stop().animate({
                    opacity:1
                },300,function(){
                });
            })
        },

        nextSlide: function(e){
            if (e&&App.slider['pricing']){
                clearInterval(App.slider['pricing']);
            }
            var self = this;
            var count = this.$el.find(".purchasingSlider .purchasing").length;
            var n = this.$el.find(".purchasingSlider .purchasing").index(this.$el.find(".purchasingSlider .purchasing.selected"));
            this.$el.find(".purchasingSlider .purchasing.selected").stop().animate({
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
                self.$el.find(".purchasingSlider .purchasing").eq(k).addClass("selected").css({opacity: 0}).stop().animate({
                    opacity: 1
                }, 300, function () {
                });

            })
        },
        updateCSS: function () {
            var self = this;
            if (App.slider['pricing']) {
                clearInterval(App.slider['pricing']);
            }
            if (window.innerWidth <= 640) {
                App.slider['pricing'] = setInterval(function () {
                    self.nextSlide()
                }, 5000);
            }
        },

        render: function () {
            this.$el.html(_.template(Template));
            this.updateCSS();
            return this;
        }
    });

    return View;

});
