define([
    'text!templates/registration/registrationTemplate.html',
    'checkPass',
    "validation"
], function (RegistrationTemplate, checkPass, validation) {
    var View = Backbone.View.extend({

        el: "#wrapper",
        events: {
            "input #pass": "progressBar",
            "click .cancel": "cancel",
            "click .registerBtn": "register",
            "click .preview, .uploadAvatar": "showFiles",
            "change #ava": "showPreview",
            "keyup .required input": "changeText"
        },
        initialize: function () {
            $(".progressBar").progressbar({value: 5});
            this.render();
        },

        changeText: function (e) {
            if ($(e.target).val()) {
                $(e.target).parents(".required").addClass("full");
            } else {
                $(e.target).parents(".required").removeClass("full");
            }
        },

        showFiles: function (e) {
            this.$el.find("#ava").click();
        },

        showPreview: function (e) {
            var input = e.target;
            if (input.files && input.files[0]) {
                var FR = new FileReader();
                FR.onload = function (e) {
                    $('.preview').attr("src", e.target.result);
                };
                FR.readAsDataURL(input.files[0]);
            }
        },

        register: function (e) {
            var self = this;

            var isError = false;
            var message = '';
            var ENTER_REQUIRED_FIELDS = 'Please, enter all required fields.';
            self.$el.find(".registration .error").removeClass("error");

            if (!self.$el.find(".registration .email").val() || !self.$el.find(".registration .firstName").val() || !self.$el.find(".registration .lastName").val() || !self.$el.find(".registration .userName").val()
                || !self.$el.find(".registration .organization").val() || !self.$el.find(".registration .phone").val() || !self.$el.find(".registration .pass").val()) {
                isError = true;
                message = (message == '') ? ENTER_REQUIRED_FIELDS : message;
            }

            //firstName
            if (!validation.validName(self.$el.find(".registration .firstName").val())) {
                isError = true;
                self.$el.find(".registration .firstName").addClass("error");
                message = (message == '') ? "First name is not valid. Field should contain only the following symbols: a-z, A-Z" : message;
                //message = (message == '') ? "Character\`s number should be from 2 to 20" : message;
            }

            //lastName
            if (!validation.validName(self.$el.find(".registration .lastName").val())) {
                isError = true;
                self.$el.find(".registration .lastName").addClass("error");
                message = (message == '') ? "Last name is not valid. Field should contain only the following symbols: a-z, A-Z" : message;
            }

            //organization
            if (!self.$el.find(".registration .organization").val() || self.$el.find(".registration .organization").val() < 2 || self.$el.find(".registration .organization").val() > 30) {
                isError = true;
                self.$el.find(".registration .organization").addClass("error");
                message = (message == '') ? "That is not a valid organization name. Field can not contain '~ < > ^ * ₴' signs only a-z A-Z" : message;
            }

            //phone
            if (!validation.validPhone(self.$el.find(".registration .phone").val())) {
                isError = true;
                self.$el.find(".registration .phone").addClass("error");
                message = (message == '') ? "That is not a valid phone number. It should contain only numbers and '+ - ( )' signs" : message;
            }

            //userName
            if (!validation.validLogin(self.$el.find(".registration .userName").val())) {
                isError = true;
                self.$el.find(".registration .userName").addClass("error");
                message = (message == '') ? "That is not a valid user name. It must consist of only following symbols: A-Z, a-z, 0-9, _ @" : message;
            }

            //email
            if (!validation.validEmail(self.$el.find(".registration .email").val())) {
                isError = true;
                self.$el.find(".registration .email").addClass("error");
                message = (message == '') ? (self.$el.find(".registration .email").val() + " is not a valid email.") : message;
            }

            var pass = self.$el.find(".registration .pass").val();
            var rate = checkPass.scorePassword(pass);

            if (rate < 30) {
                isError = true;
                self.$el.find(".registration .pass").addClass("error");
                message = (message == '') ? "Your password is weak. Please choose stronger password" : message;
            }

            if (!self.$el.find(".registration .conf").val() || self.$el.find(".registration .conf").val() !== self.$el.find(".registration .pass").val()) {
                isError = true;
                self.$el.find(".registration .conf").addClass("error");
                message = (message == '') ? 'Passwords do not match.' : message;
            }

            if (isError) {
                App.notification(message);
                return;
            }

            $.ajax({
                url: "/signUp",
                type: "POST",
                xhrFields: {
                    withCredentials: true
                },
                data: {
                    email: self.$el.find(".registration .email").val(),
                    firstName: self.$el.find(".registration .firstName").val(),
                    lastName: self.$el.find(".registration .lastName").val(),
                    userName: self.$el.find(".registration .userName").val(),
                    organization: self.$el.find(".registration .organization").val(),
                    pass: self.$el.find(".registration .pass").val(),
                    phone: self.$el.find(".registration .phone").val(),
                    avatar: self.$el.find(".registration .preview").attr("src")
                },
                success: function (model) {
                    console.log(model);
                    //ToDo: Develop
                    window.location = 'https://account.mooloop.com/oauth/authorize?response_type=code&client_id=FcDOCBsnZ2TtKbHTGULY&redirect_uri=http://demo.com:8838/redirect&scope=jumplead.contacts,jumplead.personal';

                    //ToDo: Production
                    //window.location = 'https://account.mooloop.com/oauth/authorize?response_type=code&client_id=uemnB2ZAA92gv5CoTCHc&redirect_uri=http://projects.thinkmobiles.com:8838/redirect&scope=jumplead.contacts,jumplead.personal';
                },
                error: function (err) {
                    console.log(err);

                    App.notification(err.responseJSON.error);
                }
            });
        },

        progressBar: function () {
            var pass = $("#pass").val();
            var rate = checkPass.scorePassword(pass);
            var add = checkPass.checkPassStrength(pass);
            var remove = add === "weak" ? "good strong" : (add === "good" ? "weak strong" : "good weak");
            //console.log( $("#progressBar"));
            $(".progressBar").progressbar({value: rate});
            $(".ui-progressbar-value").addClass(add).removeClass(remove);
        },
        cancel: function (e) {
            Backbone.history.navigate("#/home", {trigger: true});
        },

        render: function () {
            this.$el.html(_.template(RegistrationTemplate));
            return this;
        }

    });

    return View;

});
