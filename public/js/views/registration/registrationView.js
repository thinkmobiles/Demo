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
            if (!input.files || !input.files[0] || !input.files[0].size || input.files[0].type.indexOf('image') === -1) {
                App.notification("Invalid file type. An uploaded avatar must be in GIF, JPEG, or PNG format.");
                return;
            }
            var FR = new FileReader();
            FR.onload = function (e) {
                $('.preview').attr("src", e.target.result);
            };
            FR.readAsDataURL(input.files[0]);
        },

        register: function (e) {
            var self = this;

            var isError = false;
            var message = '';
            var ENTER_REQUIRED_FIELDS = 'Please, enter all required fields.';
            self.$el.find(".registration .error").removeClass("error");

            if (!self.$el.find(".registration .email").val() || !self.$el.find(".registration .firstName").val() || !self.$el.find(".registration .lastName").val() || !self.$el.find(".registration .userName").val()
                || !self.$el.find(".registration .organization").val() || !self.$el.find(".registration .phone").val() || !self.$el.find(".registration .pass").val()) {
                message = (message == '') ? ENTER_REQUIRED_FIELDS : message;
                isError = true;
            }

            //firstName
            if (!validation.validLength(self.$el.find(".registration .firstName").val(), 2, 20)) {
                message = (message == '') ? "First name is not valid. Character\`s number should be from 2 to 20" : message;
                self.$el.find(".registration .firstName").addClass("error");
                isError = true;
            }
            if (!validation.validName(self.$el.find(".registration .firstName").val())) {
                message = (message == '') ? "First name is not valid. Field should contain only the following symbols: a-z, A-Z" : message;
                self.$el.find(".registration .firstName").addClass("error");
                isError = true;
            }

            //lastName
            if (!validation.validLength(self.$el.find(".registration .lastName").val(), 2, 20)) {
                message = (message == '') ? "Last name is not valid. Character\`s number should be from 2 to 20" : message;
                self.$el.find(".registration .lastName").addClass("error");
                isError = true;
            }
            if (!validation.validName(self.$el.find(".registration .lastName").val())) {
                message = (message == '') ? "Last name is not valid. Field should contain only the following symbols: a-z, A-Z" : message;
                self.$el.find(".registration .lastName").addClass("error");
                isError = true;
            }

            //organization
            if (!validation.validLength(self.$el.find(".registration .organization").val(), 2, 30)) {
                message = (message == '') ? "Organization name is not a valid. Character\`s number should be from 2 to 20" : message;
                self.$el.find(".registration .organization").addClass("error");
                isError = true;
            }
            if (!validation.validOrg(self.$el.find(".registration .organization").val())) {
                message = (message == '') ? "Organization name is not a valid . Field should contain only the following symbols: a-z, A-Z" : message;
                self.$el.find(".registration .organization").addClass("error");
                isError = true;
            }

            //phone
            if (!validation.validPhone(self.$el.find(".registration .phone").val())) {
                message = (message == '') ? "Phone number is not a valid. It should contain only numbers and '+ - ( )' signs" : message;
                self.$el.find(".registration .phone").addClass("error");
                isError = true;
            }

            //userName
            if (!validation.validLogin(self.$el.find(".registration .userName").val())) {
                message = (message == '') ? "UserName is not a valid. Character\`s number should be from 4 to 20" : message;
                self.$el.find(".registration .userName").addClass("error");
                isError = true;
            }
            if (!validation.validLogin(self.$el.find(".registration .userName").val())) {
                message = (message == '') ? "UserName is not a valid. Field should contain only the following symbols: A-Z, a-z, 0-9, _ @" : message;
                self.$el.find(".registration .userName").addClass("error");
                isError = true;
            }

            //email
            if (!validation.validEmail(self.$el.find(".registration .email").val())) {
                message = (message == '') ? (self.$el.find(".registration .email").val() + " is not a valid email.") : message;
                self.$el.find(".registration .email").addClass("error");
                isError = true;
            }

            var pass = self.$el.find(".registration .pass").val();
            var rate = checkPass.scorePassword(pass);

            if (rate < 30) {
                message = (message == '') ? "Your password is weak. Please choose stronger password" : message;
                self.$el.find(".registration .pass").addClass("error");
                isError = true;
            }

            if (!self.$el.find(".registration .conf").val() || self.$el.find(".registration .conf").val() !== self.$el.find(".registration .pass").val()) {
                message = (message == '') ? 'Passwords do not match.' : message;
                self.$el.find(".registration .conf").addClass("error");
                isError = true;
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
                    //
                    //ToDo: Production
                    //window.location = 'https://account.mooloop.com/oauth/authorize?response_type=code&client_id=uemnB2ZAA92gv5CoTCHc&redirect_uri=http://127.0.0.1:8838/redirect&scope=jumplead.contacts,jumplead.personal';
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
