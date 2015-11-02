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
            this.$el.find(".error").removeClass("error");
            if (!validation.validEmail(this.$el.find("#email").val())) {
                this.$el.find("#email").addClass("error");
                isError = true;
            }
            if (!this.$el.find("#confirmEmail").val() || this.$el.find("#email").val() !== this.$el.find("#confirmEmail").val()) {
                this.$el.find("#confirmEmail").addClass("error");
                isError = true;
            }

            if (!validation.validName(this.$el.find("#fname").val())) {
                this.$el.find("#fname").addClass("error");
                isError = true;
            }
            if (!validation.validName(this.$el.find("#lname").val())) {
                this.$el.find("#lname").addClass("error");
                isError = true;
            }
            if (!validation.validPhone(this.$el.find("#phone").val())) {
                this.$el.find("#phone").addClass("error");
                isError = true;
            }
            if (!this.$el.find("#organization").val()) {
                this.$el.find("#organization").addClass("error");
                isError = true;
            }
            if (!validation.validName(this.$el.find("#title").val())) {
                this.$el.find("#title").addClass("error");
                isError = true;
            }


            if (isError)return;
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
                        Backbone.history.navigate("//chooseViewer/"+self.content.videoId+"/"+id.toString(), {trigger: false});
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
            //$(".register-dialog").remove();
            //$(".watch-dialog").show();
            //$(".watchDemo").show();
            Backbone.history.navigate("//chooseViewer/"+this.content.videoId+"/"+this.content.userId, {trigger: false});
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
