define([
    'text!templates/contact/contactTemplate.html',
    "validation"
], function (Template, validation) {
    var View = Backbone.View.extend({

        el: "#wrapper",
        events: {
            "click .cancel": "back",
            "click .buttons .registerBtn": "send"
        },

        initialize: function (purchase) {
            this.purchase = purchase;
            this.render();
        },

        back: function () {
            if(this.purchase){
                Backbone.history.navigate("#/pricing", {trigger: true});
                return;
            }
            Backbone.history.navigate("#/home", {trigger: true});
        },

        send: function () {
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

            //firstName
            if (!validation.validLength(self.$el.find(".contactPage .firstName").val(), 2, 20)) {
                message = (message == '') ? "First name is not valid. Character`s number should be from 2 to 20" : message;
                self.$el.find(".contactPage .firstName").addClass("error");
                isError = true;
            }
            if (!validation.validName(self.$el.find(".contactPage .firstName").val())) {
                message = (message == '') ? "First name is not valid. Field should contain only the following symbols: a-z, A-Z" : message;
                self.$el.find(".contactPage .firstName").addClass("error");
                isError = true;
            }

            //lastName
            if (!validation.validLength(self.$el.find(".contactPage .lastName").val(), 2, 20)) {
                message = (message == '') ? "Last name is not valid. Character`s number should be from 2 to 20" : message;
                self.$el.find(".contactPage .lastName").addClass("error");
                isError = true;
            }
            if (!validation.validName(self.$el.find(".contactPage .lastName").val())) {
                message = (message == '') ? "Last name is not valid. Field should contain only the following symbols: a-z, A-Z" : message;
                self.$el.find(".contactPage .lastName").addClass("error");
                isError = true;
            }

            //company
            if (!validation.validLength(self.$el.find(".contactPage .company").val(), 2, 20)) {
                message = (message == '') ? "Company name is not valid. Character`s number should be from 2 to 20" : message;
                self.$el.find(".contactPage .company").addClass("error");
                isError = true;
            }
            if (!validation.validOrg(self.$el.find(".contactPage .company").val())) {
                message = (message == '') ? "Company name is not valid. Field should contain only the following symbols: a-z, A-Z" : message;
                self.$el.find(".contactPage .company").addClass("error");
                isError = true;
            }

            //title
            if (!validation.validLength(self.$el.find(".contactPage .title").val(), 2, 20)) {
                message = (message == '') ? "Title is not valid. Character`s number should be from 2 to 20" : message;
                self.$el.find(".contactPage .title").addClass("error");
                isError = true;
            }
            if (!validation.validTitle(self.$el.find(".contactPage .title").val())) {
                message = (message == '') ? "Title is not valid. Field should contain only the following symbols: a-z, A-Z" : message;
                self.$el.find(".contactPage .title").addClass("error");
                isError = true;
            }

            //email
            if (!validation.validEmail(self.$el.find(".contactPage .email").val())) {
                message = (message == '') ? (self.$el.find(".contactPage .email").val() + " is not a valid email.") : message;
                self.$el.find(".contactPage .email").addClass("error");
                isError = true;
            }

            //phone
            if (!validation.validPhone(self.$el.find(".contactPage .phone").val())) {
                message = (message == '') ? "That is not a valid phone number. It should contain only numbers and '+ - ( )' signs" : message;
                self.$el.find(".contactPage .phone").addClass("error");
                isError = true;
            }

            //notes
            if (!self.$el.find(".contactPage .notes").val() || self.$el.find(".contactPage .notes").val() < 2 || self.$el.find(".contactPage .notes").val() > 100) {
                message = (message == '') ? "Notes is not valid. Character`s number should be from 2 to 300" : message;
                self.$el.find(".contactPage .notes").addClass("error");
                isError = true;
            }
            if (!validation.validLength(self.$el.find(".contactPage .notes").val(), 2, 300)) {
                message = (message == '') ? "Notes is not valid. Field should contain only the following symbols: a-z, A-Z" : message;
                self.$el.find(".contactPage .notes").addClass("error");
                isError = true;
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
                success: function () {
                    Backbone.history.navigate("#/home", {trigger: true});
                    App.notification("We have received your message and will get back to you as soon as possible!");
                    $('html, body').animate({scrollTop: 0}, 'medium');
                },
                error: function (err) {
                    App.error(err);
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
