define([
    'text!templates/modal/contactMeTemplate.html',
    "models/contactModel",
    "validation"
], function (modalTemplate, ContactModel, validation) {

    var View;

    View = Backbone.View.extend({
        el: "#topMenu",
        events: {
            "click .send": "send",
            "click .ui-dialog-titlebar-close": "clickOnClose"
        },


        initialize: function (options) {
            var self = this;
            this.modal = null;
            this.videoModal = null;
            this.videoId = options && options.videoId ? options.videoId : "";
            this.userId = options && options.userId ? options.userId : "";
            this.page = options && options.page ? options.page : "watchVideo";
            this.indexList = options && options.indexList ? options.indexList : [];
            App.getContent(this.videoId, this.userId, function (content) {
                self.content = content;
                self.render();
            });
        },

        send: function () {

            var self = this;
            var contactModel = new ContactModel();
            var hasError = false;
            this.$el.find(".error").removeClass("error");
            var message = '';

            var ENTER_REQUIRED_FIELDS = 'Please enter all required fields!';

            if (!self.$el.find(".desc").val() || !self.$el.find(".email").val() || !self.$el.find(".name").val()) {
                hasError = true;
                message = (message == '') ? ENTER_REQUIRED_FIELDS : message;
            }
            if (!validation.validLength(this.$el.find(".name").val(), 2, 50)) {
                this.$el.find(".name").addClass("error");
                hasError = true;
                message = (message == '') ? "That is not a valid name. Character`s number should be from 2 to 50" : message;
            }
            if (!validation.validName(this.$el.find(".name").val())) {
                this.$el.find(".name").addClass("error");
                hasError = true;
                message = (message == '') ? "That is not a valid name. Field can contain 'a-z' 'A-Z' signs only" : message;
            }

            if (!validation.validEmail(this.$el.find(".email").val())) {
                this.$el.find(".email").addClass("error");
                hasError = true;
                message = (message == '') ? (self.$el.find(".email").val() + " is not a valid email.") : message;
            }

            if (!validation.validLength(this.$el.find(".desc").val(),2,200)) {
                message = (message == '') ? "Description is not a valid. Character`s number should be from 2 to 300" : message;
                this.$el.find(".desc").addClass("error");
                hasError = true;
            }if (!validation.validComment(this.$el.find(".desc").val())) {
                this.$el.find(".desc").addClass("error");
                hasError = true;
                message = (message == '') ? "Description is not a valid. Field should contain only the following symbols: a-z, A-Z" : message;
            }

            if (hasError) {
                App.notification(message);
                return;
            }

            contactModel.save({
                contentId: this.videoId,
                name: this.$el.find(".name").val(),
                email: this.$el.find(".email").val(),
                message: this.$el.find(".desc").val()
            }, {
                wait: true,
                success: function (model, response) {
                    Backbone.history.navigate("#/" + self.page + "/" + self.videoId + "/" + self.userId + (self.indexList.length ? ("/" + self.indexList) : ""), {trigger: true});

                },
                error: function (model, response) {
                   App.error(response);
                    Backbone.history.navigate("#/" + self.page + "/" + self.videoId + "/" + self.userId + (self.indexList.length ? ("/" + self.indexList) : ""), {trigger: true});

                }
            });


        },


        clickOnClose: function () {
            Backbone.history.navigate("/home/" + this.videoId + "/" + this.userId, {trigger: false});
        },

        render: function () {
            var formString = _.template(modalTemplate)({
                contact: this.content.toJSON().contact
            });
            this.dialog = $(formString).dialog({
                modal: true,
                resizable: false,
                draggable: false,
                closeOnEscape: false,
                appendTo: "#topMenu",
                dialogClass: "watch-dialog",
                width: 425,
                position: {
                    my: "center center",
                    at: "center center"
                },
                create: function (e) {
                    if (window.innerWidth <= 700) {
                        $(document).find('#wrapper').css({'display': 'none'});
                        $(document).find('#footer').css({'display': 'none'});
                    } else {
                        $(e.target).parent().css({'position': 'fixed'});
                        $(document).find('.topMenu').addClass('small');
                    }
                }
            });
            return this;
        }
    });
    return View;
});
