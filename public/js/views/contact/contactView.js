define([
    'text!templates/contact/contactTemplate.html',
	"validation"
], function (Template, validation) {
    var View = Backbone.View.extend({

		el:"#wrapper",
        events:{
			"click .cancel":"back",
			"click .buttons .registerBtn" :"send"
        },
        initialize: function () {
            this.render();
        },
		
		back: function(){
			Backbone.history.navigate("#/home", {trigger: true});
		},

		
		
		send: function(){
			var self = this;
			var isError = false;
			
			self.$el.find(".contactPage .error").removeClass("error");

			if (!validation.validEmail(self.$el.find(".contactPage .email").val())){
				isError = true;
				self.$el.find(".contactPage .email").addClass("error");
			}
			if (!validation.validName(self.$el.find(".contactPage .firstName").val())){
				isError = true;
				self.$el.find(".contactPage .firstName").addClass("error");
			}
			if (!validation.validName(self.$el.find(".contactPage .lastName").val())){
				isError = true;
				self.$el.find(".contactPage .lastName").addClass("error");
			}
	
			if (isError)return;
			$.ajax({
                url: "/admin/contact",
                type: "POST",
                dataType: 'json',
                data: {
                    email: self.$el.find(".contactPage .email").val(),
					firstName: self.$el.find(".contactPage .firstName").val(),
					lastName: self.$el.find(".contactPage .lastName").val(),
					company: self.$el.find(".contactPage .company").val(),
					phone: self.$el.find(".contactPage .phone").val(),
					notes: self.$el.find(".contactPage .notes").val(),
					title: self.$el.find(".contactPage .title").val()
                },
                success: function (response) {
					Backbone.history.navigate("#/home",{ trigger:true })
					App.notification("Sended");
                },
                error: function (err) {
					App.notification("Some error");
				}
            });
		},
		
        render: function () {
            this.$el.html(_.template(Template));
            return this;
        }

    });

    return View;

});
