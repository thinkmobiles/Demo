define([
    'text!templates/users/usersTemplate.html',
	'text!templates/users/pendingTemplate.html',
	'text!templates/users/confirmedTemplate.html',
	"collections/pendingUsersCollection",
	"collections/confirmedUsersCollection",
	"moment"
], function (UsersTemplate, PendingTemplate, ConfirmedTemplate, PendingUsersCollection, ConfirmedUsersCollection, moment) {
    var View = Backbone.View.extend({

		el:"#wrapper",
        events:{
			'click .customTable tr': 'chooseRow',
            'click .confirm': 'confirm',
            'click .delete': 'delete',
            'click .disable': 'disable',
			'click .editBtn': 'edit',
			'click .saveBtn': 'save'
        },
        initialize: function () {
			var self = this;
			this.usersCollection = new PendingUsersCollection();
			this.usersCollection.bind('reset', self.renderPending, self);
			this.confirmedCollection = new ConfirmedUsersCollection();
			this.confirmedCollection.bind('reset', self.renderConfirmed, self);
			this.pendingChoosed = 0;
			this.confirmedChoosed = 0;
			this.dataFormat = "DD MMM YYYY";
			this.render();
        },

		chooseRow: function (e) {
            var index = $(e.target).closest("table").find("tr").index($(e.target).closest("tr"));

            if (index) {
				
				if ($(e.target).parents("#pendingAccount").length){
					this.pendingChoosed = index-1;
				}else{
					this.confirmedChoosed = index-1;
				}
				
                $(e.target).closest("table").find(".current").removeClass("current");
                $(e.target).closest("tr").addClass("current");

				this.updateDisableBtn();
            }
        },

		edit: function(e){
			$(e.target).parents(".accountContainer").find(".customTable .current").addClass("edited");
		},
		
		updateDisableBtn:function(){
			var text = this.$el.find("#confirmedAccount table").find(".current .status").text()=="Disabled"?"Enable":"Disable";
			this.$el.find(".disable").text(text);
			
		},
		
		updateUser:function(id,obj){
			var model =  this.usersCollection.get(id)||this.confirmedCollection.get(id);
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

		save: function (e) {
            var row = $(e.target).parents(".accountContainer").find(".customTable .current");
			var id = row.data("id");
			this.updateUser(id, {
				subscriptionStart:row.find("input").eq(0).datepicker('getDate'),
				subscriptionEnd:row.find("input").eq(0).datepicker('getDate')
			});
        },

		
        confirm: function (e) {
            var id = $(e.target).parents(".accountContainer").find(".customTable .current").data("id");
			this.updateUser(id, {isConfirmed: true});
        },

        disable: function (e) {
            var row =$(e.target).parents(".accountContainer").find(".customTable .current");
            var id = row.data("id");
            var status = row.find("span.status").text();
			this.updateUser(id, {isDisabled: status==='Disabled'?false:true});
		
        },

        delete: function (e) {
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
			

        },

		renderPending: function () {
			var self = this;
			var users = this.usersCollection.toJSON();
			users = _.map(users,function(user){
				user.subscriptionStart = user.subscriptionStart?moment(user.subscriptionStart).format(self.dataFormat):moment().format(self.dataFormat);
				user.subscriptionEnd =  user.subscriptionEnd?moment(user.subscriptionEnd).format(self.dataFormat):moment().add(3, 'month').format(self.dataFormat);
				return user;
			});
            this.$el.find("#pendingAccount").html(_.template(PendingTemplate)({users:users, current:this.pendingChoosed }));
            return this;
         },
		renderConfirmed: function () {
			var self = this;
			var users = this.confirmedCollection.toJSON();
			users = _.map(users,function(user){
				user.subscriptionStart = moment(user.subscriptionStart).format(self.dataFormat);
				user.subscriptionEnd = moment(user.subscriptionEnd).format(self.dataFormat);
				return user;
			});
            this.$el.find("#confirmedAccount").html(_.template(ConfirmedTemplate)({users:users, current: this.confirmedChoosed }));
			this.updateDisableBtn();

			this.$el.find(".customTable input").datepicker({ dateFormat: 'dd M yy' });
			
            return this;
         },
        render: function () {
            this.$el.html(_.template(UsersTemplate));
            return this;
        }

    });

    return View;

});
