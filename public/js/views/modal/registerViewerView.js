define([
    'text!templates/home/registerModalTemplate.html',
    "models/prospectModel",
    "validation"
], function (modalTemplate, ProspectModel, validation) {

    var View;

    View = Backbone.View.extend({
        el: "#topMenu",
        events: {
            "click .ui-dialog-titlebar-close": "closeDialog",
            "click .continue": "register",
            "keyup .required input": "changeText"
        },


        initialize: function (options) {
            this.videoModal = null;
            this.content = options;
            this.render();
        },

        changeText: function (e) {
            if ($(e.target).val()) {
                $(e.target).parents(".required").addClass("full");
            } else {
                $(e.target).parents(".required").removeClass("full");
            }
        },

        register: function () {
            var self = this;
            var prospectModel = new ProspectModel();
            var isError = false;
            var message = '';
            var ENTER_REQUIRED_FIELDS = 'Please enter all required fields!';
            this.$el.find(".error").removeClass("error");

            if (!this.$el.find("#fname").val()|| !this.$el.find("#organization").val() || !this.$el.find("#lname").val()|| !this.$el.find("#title").val()||!this.$el.find("#email").val()
            || !this.$el.find("#phone").val() ||!this.$el.find("#confirmEmail").val()) {
                isError = true;
                message = (message == '') ? ENTER_REQUIRED_FIELDS : message;
            }

            //fName
            if (!validation.validName(this.$el.find("#fname").val())) {
                this.$el.find("#fname").addClass("error");
                message = (message == '') ? "That is not a valid first name. Field can not contain '~ < > ^ * ₴' signs only a-z A-Z" : message;
                isError = true;
            }

            //organization
            if (!this.$el.find("#organization").val()) {
                this.$el.find("#organization").addClass("error");
                message = (message == '') ? "That is not a valid organization name." : message;
                isError = true;
            }

            //lName
            if (!validation.validName(this.$el.find("#lname").val())) {
                this.$el.find("#lname").addClass("error");
                message = (message == '') ? "That is not a valid last name." : message;
                isError = true;
            }

            //title
            if (!validation.validTitle(this.$el.find("#title").val())) {
                this.$el.find("#title").addClass("error");
                message = (message == '') ? "That is not a valid title." : message;
                isError = true;
            }

            //email
            if (!validation.validEmail(this.$el.find("#email").val())) {
                this.$el.find("#email").addClass("error");
                message = (message == '') ? (self.$el.find("#email").val() + " is not a valid email.") : message;
                isError = true;
            }

            //confPass
            if (!this.$el.find("#confirmEmail").val() || this.$el.find("#email").val() !== this.$el.find("#confirmEmail").val()) {
                this.$el.find("#confirmEmail").addClass("error");
                message = (message == '') ? 'Password and confirm password field do not match.' : message;
                isError = true;
            }

            //phone
            if (!validation.validPhone(this.$el.find("#phone").val())) {
                this.$el.find("#phone").addClass("error");
                message = (message == '') ? "That is not a valid phone number. It should contain only numbers and '+ - ( )' signs" : message;
                isError = true;
            }

              //phone
            if (!validation.validComment(this.$el.find("#comments").val())) {
                this.$el.find("#comments").addClass("error");
                message = (message == '') ? "That is not a valid comment." : message;
                isError = true;
            }



            if (isError) {
                App.notification(message);
                return;
            }

            prospectModel.save({
                    email: this.$el.find("#email").val(),
                    firstName: this.$el.find("#fname").val(),
                    lastName: this.$el.find("#lname").val(),
                    phone: this.$el.find("#phone").val(),
                    organization: this.$el.find("#organization").val(),
                    title: this.$el.find("#title").val(),
                    comments: this.$el.find("#comments").val()||'',
                    contentId: self.content.videoId
                },
                {
                    wait: true,
                    success: function (model, response) {
                        self.dialog.hide();
                        if (self.videoModal) {
                            self.videoModal.undelegateEvents();
                        }

                        //var url = window.location.hash;
                        var id = response.id;
                        Backbone.history.navigate("#/chooseViewer/"+self.content.videoId+"/"+id.toString(), {trigger: false});
                        //var navUrl = url.substring(0, url.length - 24) + id.toString();
                        //var navUrl = url.substring(0, url.length - 24) + id.toString();
                        //Backbone.history.navigate(navUrl, {trigger: true, replace: true});


                    },
                    error: function (err) {
                        App.notification("Some trouble happened, please try again!");
                        Backbone.history.navigate("/home", {trigger: true});
                        console.log(JSON.stringify(err));
                    }
                });

        },

        closeDialog: function (e) {
            e.preventDefault();
            e.stopPropagation();
            if(this.content.userId ==='new'){
                Backbone.history.navigate("#/home", {trigger: true});
                return;
            }
            Backbone.history.navigate("#/chooseViewer/"+this.content.videoId+"/"+this.content.userId, {trigger: false});
        },


        render: function () {
            var formString = _.template(modalTemplate)({});
            this.dialog = $(formString).dialog({
                modal:true,
                resizable: false,
                draggable: false,
                closeOnEscape: false,
                appendTo:"#topMenu",
                dialogClass: "watch-dialog",
                width: 700,
                position: {
                    my: "center center+50px",
                    at: "center center"
                },
                create: function (e) {
                    if (window.innerWidth <= 736) {
                        $(document).find('#wrapper').css({'display': 'none'});
                        $(document).find('#footer').css({'display': 'none'});
                    }else{
                        $(e.target).parent().css({'position':'fixed'});
                        $(document).find('.topMenu').addClass('small');
                    }
                }
            });
            return this;
        }


    });
    return View;
});
