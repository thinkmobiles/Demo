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
			$('html, body').animate({ scrollTop: 0 }, 'medium');
		},

		send: function() {
			var self = this;
			var isError = false;
			var message = '';
			var ENTER_REQUIRED_FIELDS = 'Please enter all required fields!';

			self.$el.find(".contactPage .error").removeClass("error");
			if (!self.$el.find(".contactPage .email").val() || !self.$el.find(".contactPage .firstName").val() || !self.$el.find(".contactPage .lastName").val() || !self.$el.find(".contactPage .company").val()
				|| !self.$el.find(".contactPage .title").val() || !self.$el.find(".contactPage .phone").val() || !self.$el.find(".contactPage .notes").val()) {
				isError = true;
				message = (message == '') ? ENTER_REQUIRED_FIELDS : message;
			}

			if (!validation.validName(self.$el.find(".contactPage .firstName").val())) {
				isError = true;
				self.$el.find(".contactPage .firstName").addClass("error");
				message = (message == '') ? "That is not a valid first name. Field can not contain '~ < > ^ * ₴' signs only a-z A-Z" : message;
			}

			if (!validation.validName(self.$el.find(".contactPage .lastName").val())) {
				isError = true;
				self.$el.find(".contactPage .lastName").addClass("error");
				message = (message == '') ? "That is not a valid last name. Field can not contain '~ < > ^ * ₴' signs only a-z A-Z" : message;
			}

			if (!validation.validName(self.$el.find(".contactPage .company").val())) {
				isError = true;
				self.$el.find(".contactPage .company").addClass("error");
				message = (message == '') ? "That is not a valid company name. Field can not contain '~ < > ^ * ₴' signs only a-z A-Z" : message;
			}

			if (!self.$el.find(".contactPage .title").val()) {
				isError = true;
				self.$el.find(".contactPage .title").addClass("error");
				message = (message == '') ? "That is not a valid title. Field can not contain '~ < > ^ * ₴' signs only a-z A-Z" : message;

			}

			if (!validation.validPhone(self.$el.find(".contactPage .phone").val())) {
				isError = true;
				self.$el.find(".contactPage .phone").addClass("error");
				message = (message == '') ? "That is not a valid phone number. It should contain only numbers and '+ - ( )' signs" : message;
			}

			if (!validation.validEmail(self.$el.find(".contactPage .email").val())) {
				isError = true;
				self.$el.find(".contactPage .email").addClass("error");
				message = (message == '') ? (self.$el.find(".registration .email").val() + " is not a valid email.") : message;
			}

			if (!self.$el.find(".contactPage .notes").val() || self.$el.find(".contactPage .notes").val() < 2 || self.$el.find(".contactPage .notes").val() > 100) {
				isError = true;
				self.$el.find(".contactPage .notes").addClass("error");
				message = (message == '') ? "That is not a valid user notes. It should contain only the following symbols: A-Z, a-z, 0-9, _ @" : message;
			}

			if (isError) {
				App.notification(message);
				return;
			}
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
					Backbone.history.navigate("#/home", {trigger: true});
					App.notification("We have received your message and will get back to you as soon as possible!");
					$('html, body').animate({scrollTop: 0}, 'medium');
				},
				error: function (err) {
					App.notification("Some error, please try again");
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
