define([
    'text!templates/users/usersTemplate.html',
	'text!templates/users/pendingTemplate.html',
	'text!templates/users/confirmedTemplate.html',
	"collections/pendingUsersCollection",
	"collections/confirmedUsersCollection",
	"models/confirmedUsersModel",
	"models/pendingUsersModel"
], function (UsersTemplate, PendingTemplate, ConfirmedTemplate, PendingUsersCollection, ConfirmedUsersCollection) {
    var View = Backbone.View.extend({

		el:"#wrapper",
        events:{
            'click .confirm': 'confirm',
            'click .delete': 'delete'
        },
        initialize: function () {
			var self = this;
			this.usersCollection = new PendingUsersCollection();
			this.usersCollection.bind('reset', self.renderPending, self);
			this.confirmedCollection = new ConfirmedUsersCollection();
			this.confirmedCollection.bind('reset', self.renderConfirmed, self);
			this.render();
        },

        confirm: function (e) {
            var id = $(e.target).closest("tr").data("id");
           var model =  this.usersCollection.get(id);
            var self = this;
           model.save({
                   isConfirmed: true
                },{patch: true},
                {
                    wait: true,
                    success: function (model, response) {
                        alert('Updated');
                    },
                    error: function (err) {
                        console.log(JSON.stringify(err));
                    }
                });
            self.usersCollection.update();
            self.confirmedCollection.update();

        },

        delete: function (e) {
            var id = $(e.target).closest("tr").data("id");
            var model =  this.usersCollection.get(id);
            var self = this;
            model.destroy({
                    wait: true,
                    success: function (model, response) {
                        alert('Removed');
                    },
                    error: function (err) {
                        console.log(JSON.stringify(err));
                    }
                });
            self.usersCollection.update();
            self.confirmedCollection.update();

        },

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
