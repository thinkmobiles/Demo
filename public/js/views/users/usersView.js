define([
    'text!templates/users/usersTemplate.html',
	'text!templates/users/pendingTemplate.html',
	'text!templates/users/confirmedTemplate.html',
	"collections/usersCollection",
	"collections/confirmedCollection",
	"models/confirmedUserModel",
	"models/pendingUsersModel"
], function (UsersTemplate, PendingTemplate, ConfirmedTemplate, UsersCollection, ConfirmedCollection, confirmedUserModel, pendingUsersModel) {
    var View = Backbone.View.extend({

		el:"#wrapper",
        events:{
            'click .confirm': 'confirm',
            'click .delete': 'delete'
        },
        initialize: function () {
			var self = this;
			this.usersCollection = new UsersCollection();
			this.usersCollection.bind('reset', self.renderPending, self);
			this.confirmedCollection = new ConfirmedCollection();
			this.confirmedCollection.bind('reset', self.renderConfirmed, self);
			this.render();
        },
        confirm: function (e) {

        };

		 renderPending: function () {
             this.$el.find("#pendingAccount").html(_.template(PendingTemplate)({users:this.usersCollection.toJSON()}));
            return this;
         },
		renderConfirmed: function () {
             this.$el.find("#confirmedAccount").html(_.template(ConfirmedTemplate)({users:this.confirmedCollection.toJSON()}));
            return this;
         },
        render: function () {
            this.$el.html(_.template(UsersTemplate));
            return this;
        }

    });

    return View;

});
