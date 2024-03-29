define([
    'text!templates/subordinates/subordinatesTemplate.html',
    'text!templates/subordinates/dialogTemplate.html',
    'text!templates/subordinates/subordinatesListTemplate.html',
    "collections/subordinatesCollection",
    "models/subordinatesModel",
    "moment",
    "validation"
], function (SubordinatesTemplate, DialogTemplate, SubordinatesListTemplate, SubordinatesCollection, SubordinatesModel, moment, validation) {
    var View = Backbone.View.extend({

        el: "#wrapper",
        events: {
            'click .customTable tr:not(.current)': 'chooseRow',
            'click .delete': 'delete',
            'click .disable': 'disable',
            'click .editBtn': 'edit',
            'click .saveBtn': 'save',
            'click .cancelBtn': 'cancelEdit',
            'click .cancel': 'cancel',
            'click .role span': 'changeRole',
            'click .createBtn': 'createUser',
            "click .customSelect ul li": "updateRole",
            "click .customSelect .showList": "showList"
        },
        initialize: function () {
            var self = this;
            this.subordinatesModel = new SubordinatesModel();
            this.subordinatesCollection = new SubordinatesCollection();
            this.subordinatesCollection.bind('reset', self.renderSubordinatesList, self);
            this.subordinateChoosed = 0;
            this.dataFormat = "DD MMM YYYY";
            this.render();
        },

        showList: function (e) {
            e.stopPropagation();
            this.$el.find(".customSelect ul").show();
        },

        updateRole: function (e) {
            var current = $(e.target).text();
            this.$el.find(".customSelect .current").text(current);
            this.$el.find(".customSelect ul").hide();
        },

        chooseRow: function (e) {
            var self = this;
            var index = $(e.target).closest(".customTable").find("tr").index($(e.target).closest("tr"));

            if (index) {
                this.subordinateChoosed = index - 1;

                $(e.target).closest(".customTable").find("tr.current").removeClass("current");
                $(e.target).closest("tr").addClass("current");
                this.$el.find(".isEdited").removeClass("isEdited");
                self.renderSubordinatesList();
                this.updateDisableBtn();
            }

        },

        cancelEdit: function () {
            var self = this;
            this.$el.find(".isEdited").removeClass("isEdited");
            this.$el.find(".customTable").removeClass("edited");
            self.subordinatesCollection.update();
        },

        changeRole: function (e) {
            var self = this;
            $(e.target).closest('.role').find('span.active').removeClass("active");
            $(e.target).addClass("active");
        },

        edit: function (e) {
            $(e.target).closest(".subordinates").addClass("isEdited").find(".customTable tr.current").addClass("edited");
        },

        updateDisableBtn: function () {
            if (this.$el.find(".customTable").find("tr.current .status").text() == "Disabled") {
                this.$el.find(".disable").addClass("enabled");
            } else {
                this.$el.find(".disable").removeClass("enabled");
            }

        },

        updateUser: function (id, obj) {
            var model = this.subordinatesCollection.get(id);
            var self = this;
            model.save(obj,
                {
                    patch: true,
                    wait: true,
                    success: function (model, response) {
                        self.subordinatesCollection.update();
                    },
                    error: function (model, response) {
                        App.error(response);
                    }
                });

        },

        createUser: function (e) {
            var self = this;

            var isError = false;
            var message = '';
            var ENTER_REQUIRED_FIELDS = 'Please enter all required fields!';
            self.$el.find(".registration .error").removeClass("error");

            if (!self.$el.find(".registration .email").val() || !self.$el.find(".registration .firstName").val() || !self.$el.find(".registration .lastName").val() || !self.$el.find(".registration .userName").val()) {
                isError = true;
                message = (message == '') ? ENTER_REQUIRED_FIELDS : message;
            }

            //firstName
            if (!validation.validLength(self.$el.find(".registration .firstName").val(), 2, 20)) {
                message = (message == '') ? "First name is not valid. Character`s number should be from 2 to 20" : message;
                self.$el.find(".registration .firstName").addClass("error");
                isError = true;
            }else if (!validation.validName(self.$el.find(".registration .firstName").val())) {
                message = (message == '') ? "First name is not valid. Field should contain only the following symbols: a-z, A-Z" : message;
                self.$el.find(".registration .firstName").addClass("error");
                isError = true;
            }

            //lastName
            if (!validation.validLength(self.$el.find(".registration .lastName").val(), 2, 20)) {
                message = (message == '') ? "Last name is not valid. Character`s number should be from 2 to 20" : message;
                self.$el.find(".registration .lastName").addClass("error");
                isError = true;
            }else if (!validation.validName(self.$el.find(".registration .lastName").val())) {
                message = (message == '') ? "Last name is not valid. Field should contain only the following symbols: a-z, A-Z" : message;
                self.$el.find(".registration .lastName").addClass("error");
                isError = true;
            }


            //userName
            if (!validation.validLogin(self.$el.find(".registration .userName").val())) {
                message = (message == '') ? "UserName is not a valid. Character`s number should be from 4 to 20" : message;
                self.$el.find(".registration .userName").addClass("error");
                isError = true;
            }else if (!validation.validLogin(self.$el.find(".registration .userName").val())) {
                message = (message == '') ? "UserName is not a valid. Field should contain only the following symbols: A-Z, a-z, 0-9, _ @" : message;
                self.$el.find(".registration .userName").addClass("error");
                isError = true;
            }

            //email
            if (!validation.validEmail(self.$el.find(".registration .email").val())) {
                isError = true;
                self.$el.find(".registration .email").addClass("error");
                message = (message == '') ? (self.$el.find(".registration .email").val() + " is not a valid email.") : message;
            }

            if (isError) {
                App.notification(message);
                return;
            }
            var obj = {
                email: self.$el.find(".registration .email").val(),
                firstName: self.$el.find(".registration .firstName").val(),
                lastName: self.$el.find(".registration .lastName").val(),
                userName: self.$el.find(".registration .userName").val().toLowerCase(),
                role: parseInt(self.$el.find(".role .active").attr("data-role"))
            };

            this.subordinatesModel.save(obj,
                {
                    wait: true,
                    success: function (model, response) {
                        self.$el.find('.registration input[type="text"]').val('');
                        self.subordinatesCollection.update();
                    },
                    error: function (model, response) {
                        App.error(response);
                    }
                });
        },

        cancel: function () {
            this.$el.find('.registration .role span').eq(0).removeClass('active').next().addClass('active');
            this.$el.find('.registration input[type="text"]').val('').removeClass('error')
        },

        save: function (e) {
            var row = $(e.target).closest('.subordinates').find(".customTable tr.current");
            row.find(".view.role").text(row.find(".edit .customSelect span.current").text());
            var id = row.data("id");
            console.log(row.find(".edit .customSelect span.current").text());
            this.updateUser(id, {
                role: row.find(".edit .customSelect .showList span.current").text() === 'Viewer' ? 3 : 2
            });
            this.$el.find(".isEdited").removeClass("isEdited")

        },

        disable: function (e) {
            var self = this;
            var row = $(e.target).closest('.subordinates').find(".customTable tr.current");
            var id = row.data("id");
            var status = row.find("span.status").text();
            var model = this.subordinatesCollection.get(id);
            var name = model.get("firstName") + " " + model.get("lastName");
            var isDisabled = status === 'Disabled' ? false : true;
            var title = isDisabled ? "Disable User" : "Enable User";
            var btnText = isDisabled ? "Disable" : "Enable";
            this.showDialog(title, name, "CANCEL", btnText, function () {
                self.updateUser(id, {isDisabled: isDisabled});
            });
        },

        showDialog: function (title, name, cancel, ok, callback) {
            var self = this;
            var formString = _.template(DialogTemplate)({
                operation: ok,
                name: name
            });

            this.dialog = $(formString).dialog({
                modal: true,
                closeOnEscape: false,
                resizable: false,
                draggable: false,
                appendTo: "#wrapper",
                dialogClass: "confirm-dialog",
                width: 580,
                title: title,
                buttons: [
                    {
                        text: cancel,
                        "class": 'cancelButtonClass',
                        click: function () {
                            $(this).dialog("close");
                        }
                    },
                    {
                        text: ok,
                        "class": 'saveButtonClass',
                        click: function () {
                            $(this).dialog("close");
                            if (callback)callback();
                        }
                    }
                ]
            });
            setTimeout(function () {
                self.$el.find(".confirm-dialog").addClass("show");
            }, 25);
        },

        delete: function (e) {
            var id = $(e.target).closest(".subordinates").find(".customTable tr.current").data("id");
            var model = this.subordinatesCollection.get(id);
            var self = this;
            var name = model.get("firstName") + " " + model.get("lastName");

            this.showDialog("Delete User", name, "CANCEL", "DELETE", function () {
                model.destroy({
                    wait: true,
                    success: function (model, response) {
                        self.subordinatesCollection.update();
                    },
                    error: function (model, response) {
                        App.error(response);
                    }
                });

            });
        },

        renderSubordinatesList: function () {
            var users = this.subordinatesCollection.toJSON();
            if (!users.length) {
                this.$el.find("#subordinates").html('<h3>You don\'t have users</h3>');
                return;
            }

            this.$el.find("#subordinates").html(_.template(SubordinatesListTemplate)({
                users: users,
                current: this.subordinateChoosed
            }));
            this.updateDisableBtn();
            return this;
        },

        render: function () {
            this.$el.html(_.template(SubordinatesTemplate));
            return this;
        }

    });

    return View;

});
