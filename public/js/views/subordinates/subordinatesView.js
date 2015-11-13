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
			'click .confirm': 'confirm',
			'click .delete': 'delete',
			'click .disable': 'disable',
			'click .editBtn': 'edit',
			'click .saveBtn': 'save',
			'click .cancelBtn': 'cancel',
			'click .role span': 'changeRole',
			'click .createBtn': 'createUser'
		},
		initialize: function () {
			var self = this;
			this.subordinatesModel = new SubordinatesModel();
			this.subordinatesCollection = new SubordinatesCollection();
			this.subordinatesCollection.bind('reset', self.renderSubordinatesList, self);
			this.pendingChoosed = 0;
			this.confirmedChoosed = 0;
			this.dataFormat = "DD MMM YYYY";
			this.render();
		},

		chooseRow: function (e) {
			var self = this;
			var index = $(e.target).closest("table").find("tr").index($(e.target).closest("tr"));

			if (index) {
				if ($(e.target).parents("#pendingAccount").length) {
					this.pendingChoosed = index - 1;
				} else {
					this.confirmedChoosed = index - 1;
				}

				$(e.target).closest("table").find(".current").removeClass("current");
				$(e.target).closest("tr").addClass("current");

				this.updateDisableBtn();
				this.$el.find(".isEdited").removeClass("isEdited");
				self.renderPending();
				self.renderConfirmed();
			}

		},

		cancel: function () {
			var self = this;
			this.$el.find(".isEdited").removeClass("isEdited");
			self.usersCollection.update();
			self.confirmedCollection.update();
		},

		changeRole: function (e) {
			var self = this;
			$(e.target).closest('.role').find('span').toggleClass("active");
		},

		edit: function (e) {
			$(e.target).parents(".accountContainer").addClass("isEdited").find(".customTable .current").addClass("edited");
		},

		updateDisableBtn: function () {
			if (this.$el.find("#confirmedAccount table").find(".current .status").text() == "Disabled") {
				this.$el.find(".disable").addClass("enabled");
			} else {
				this.$el.find(".disable").removeClass("enabled");
			}

		},

		updateUser: function (id, obj) {
			var model = this.usersCollection.get(id) || this.confirmedCollection.get(id);
			var self = this;
			model.save(obj,
				{
					patch: true,
					wait: true,

					success: function (model, response) {
						self.usersCollection.update();
						self.confirmedCollection.update();
					},
					error: function (err) {
						console.log(JSON.stringify(err));
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
			if (!validation.validName(self.$el.find(".registration .firstName").val())) {
				isError = true;
				self.$el.find(".registration .firstName").addClass("error");
				message = (message == '') ? "That is not a valid first name. Field can not contain '~ < > ^ * ₴' signs only a-z A-Z" : message;
			}

			//lastName
			if (!validation.validName(self.$el.find(".registration .lastName").val())) {
				isError = true;
				self.$el.find(".registration .lastName").addClass("error");
				message = (message == '') ? "That is not a valid last name. Field can not contain '~ < > ^ * ₴' signs only a-z A-Z" : message;
			}


			//userName
			if (!validation.validLogin(self.$el.find(".registration .userName").val())) {
				isError = true;
				self.$el.find(".registration .userName").addClass("error");
				message = (message == '') ? "That is not a valid user name. It should contain only the following symbols: A-Z, a-z, 0-9, _ @" : message;
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
					userName: self.$el.find(".registration .userName").val(),
					role: parseInt(self.$el.find(".role .active").attr("data-role"))
			};

			this.subordinatesModel.save(obj,
				{
					wait: true,
					success: function (model, response) {
						self.subordinatesCollection.update();
					},
					error: function (err) {
						console.log(JSON.stringify(err));
					}
				});
		},

		save: function (e) {
			var row = $(e.target).parents(".accountContainer").find(".customTable .current");
			var id = row.data("id");
			this.updateUser(id, {
				subscriptionStart: row.find("input").eq(0).datepicker('getDate'),
				subscriptionEnd: row.find("input").eq(1).datepicker('getDate')
			});
			this.$el.find(".isEdited").removeClass("isEdited")

		},


		confirm: function (e) {
			var self = this;
			var id = $(e.target).parents(".accountContainer").find(".customTable .current").data("id");
			var model = this.usersCollection.get(id);
			var name = model.get("firstName") + " " + model.get("lastName");
			var start = model.get("subscriptionStart") || moment()._d;
			var end = model.get("subscriptionEnd") || moment().add(3, 'month')._d;
			this.showDialog("Confirm User", name, "CANCEL", "CONFIRM", function () {
				self.updateUser(id, {isConfirmed: true, subscriptionStart: start, subscriptionEnd: end});
			});
		},

		disable: function (e) {
			var self = this;
			var row = $(e.target).parents(".accountContainer").find(".customTable .current");
			var id = row.data("id");
			var status = row.find("span.status").text();
			var model = this.confirmedCollection.get(id);
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
				],
			});
			setTimeout(function () {
				self.$el.find(".confirm-dialog").addClass("show");
			}, 25);
		},

		delete: function (e) {
			var id = $(e.target).parents(".accountContainer").find(".customTable .current").data("id");
			var model = this.usersCollection.get(id) || this.confirmedCollection.get(id);
			var self = this;
			var name = model.get("firstName") + " " + model.get("lastName");

			this.showDialog("Delete User", name, "CANCEL", "DELETE", function () {
				model.destroy({
					wait: true,
					success: function (model, response) {
						self.usersCollection.update();
						self.confirmedCollection.update();
					},
					error: function (err) {
						console.log(JSON.stringify(err));
					}
				});

			});
			/*
			 var id = $(e.target).parents(".accountContainer").find(".customTable .current").data("id");
			 var model =  this.usersCollection.get(id)||this.confirmedCollection.get(id);
			 var self = this;
			 model.destroy({
			 wait: true,
			 success: function (model, response) {
			 self.usersCollection.update();
			 self.confirmedCollection.update();
			 },
			 error: function (err) {
			 console.log(JSON.stringify(err));
			 }
			 });
			 */

		},

		renderSubordinatesList: function () {
			var self = this;
			var users = this.subordinatesCollection.toJSON();
			this.$el.find("#subordinates").html(_.template(SubordinatesListTemplate)({
				users: users,
				current: this.pendingChoosed
			}));
			return this;
		},


		render: function () {
			this.$el.html(_.template(SubordinatesTemplate));
			return this;
		}

	});

	return View;

});
