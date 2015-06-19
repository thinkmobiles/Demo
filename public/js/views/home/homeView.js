define([
    'text!templates/home/HomeTemplate.html',
	'views/home/modalView'
], function (HomeTemplate, ModalView) {

    var View;

    View = Backbone.View.extend({
        className: "mainPage",
		el:"#wrapper",
        events: {
            "click .showModal":"showModal",
            "click .checkbox":"checkboxClick",
            "click .registration":"hideBlur",
			"click .lock":"login"
        },


        initialize: function (options) {
			this.options = options;
			this.modal = null;
            this.render();
        },

		hideBlur:function(e){
			$("body").removeClass("withLogin");
		},

		checkboxClick:function(e){
			$(e.target).closest(".checkbox").toggleClass("checked");
		},

        showModal:function(){
			if(this.modal){
				this.modal.undelegateEvents();
			}
			this.modal =new ModalView(this.options);
		},

		login:function(e){
			var self = this;
			$.ajax({
                url: "/login",
                type: "POST",
                dataType: 'json',
                data: {
                    userName: self.$el.find(".signIn .userName").val(),
                    pass: self.$el.find(".signIn .password").val()
                },
                success: function (response) {
					$("body").removeClass("withLogin");
					Backbone.history.navigate("login",{ trigger:true })
                },
                error: function (err) {
					console.log(err);
				}
            });
		},

        render: function () {
            this.$el.html(_.template(HomeTemplate));
            return this;
        }


    });
    return View;
});
