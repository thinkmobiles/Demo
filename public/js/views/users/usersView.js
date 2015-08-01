define([
    'text!templates/users/usersTemplate.html',
	'text!templates/users/pendingTemplate.html',
	'text!templates/users/confirmedTemplate.html',
	'text!templates/users/dialogTemplate.html',
	"collections/pendingUsersCollection",
	"collections/confirmedUsersCollection",
	"moment"
], function (UsersTemplate, PendingTemplate, ConfirmedTemplate, DialogTemplate, PendingUsersCollection, ConfirmedUsersCollection, moment) {
    var View = Backbone.View.extend({

		el:"#wrapper",
        events:{
			'click .customTable tr:not(.current)': 'chooseRow',
            'click .confirm': 'confirm',
            'click .delete': 'delete',
            'click .disable': 'disable',
			'click .editBtn': 'edit',
			'click .saveBtn': 'save',
			'click .cancelBtn': 'cancel'
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
			var self = this;
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
				this.$el.find(".isEdited").removeClass("isEdited");
				self.renderPending();
				self.renderConfirmed();
            }
			
        },

		cancel:function(){
			var self = this;
			this.$el.find(".isEdited").removeClass("isEdited")
			self.usersCollection.update();
			self.confirmedCollection.update();
		},
		
		edit: function(e){
			$(e.target).parents(".accountContainer").addClass("isEdited").find(".customTable .current").addClass("edited");
		},
		
		updateDisableBtn:function(){
			if (this.$el.find("#confirmedAccount table").find(".current .status").text()=="Disabled"){
				this.$el.find(".disable").addClass("enabled");
			}else{
				this.$el.find(".disable").removeClass("enabled");
			}
			
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
				subscriptionEnd:row.find("input").eq(1).datepicker('getDate')
			});
			this.$el.find(".isEdited").removeClass("isEdited")

        },

		
        confirm: function (e) {
			var self = this;
            var id = $(e.target).parents(".accountContainer").find(".customTable .current").data("id");
			var model =  this.usersCollection.get(id);
			var name = model.get("firstName")+" "+model.get("lastName");
			this.showDialog("Confirm User",name,"CANCEL", "CONFIRM", function(){
				self.updateUser(id, {isConfirmed: true});
			});
        },

        disable: function (e) {
			var self = this;
            var row =$(e.target).parents(".accountContainer").find(".customTable .current");
            var id = row.data("id");
            var status = row.find("span.status").text();
			var model =  this.confirmedCollection.get(id);
			var name = model.get("firstName")+" "+model.get("lastName");
			var isDisabled = status==='Disabled'?false:true;
			var title = isDisabled?"Disable User":"Enable User";
			var btnText = isDisabled?"Disable":"Enable";
			this.showDialog(title, name, "CANCEL", btnText, function(){
				self.updateUser(id, {isDisabled: isDisabled});
			});
        },

		showDialog: function(title, name, cancel,ok, callback){
			var self = this;
			var formString = _.template(DialogTemplate)({
				operation:ok,
				name:name
			});
			
			this.dialog = $(formString).dialog({
				modal:true,
				closeOnEscape: false,
				resizable: false,
				draggable: false,
				appendTo:"#wrapper",
				dialogClass: "confirm-dialog",
				//position: 'center',
				width: 580,
				title: title,
				buttons:  [
					{
						text: cancel,
						"class": 'cancelButtonClass',
						click: function() {
							$( this ).dialog( "close" );
						}
					},
					{
						text: ok,
						"class": 'saveButtonClass',
						click: function() {
							$( this ).dialog( "close" );
							if (callback)callback();
						}
					}
				],
			});
				setTimeout( function() {
					self.$el.find(".confirm-dialog").addClass("show");
				}, 25 );
		},

        delete: function (e) {
            var id = $(e.target).parents(".accountContainer").find(".customTable .current").data("id");
            var model =  this.usersCollection.get(id)||this.confirmedCollection.get(id);
            var self = this;
			var name = model.get("firstName")+" "+model.get("lastName");
			
			this.showDialog("Delete User",name, "CANCEL", "DELETE", function(){
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

		renderPending: function () {
			var self = this;
			var users = this.usersCollection.toJSON();
			users = _.map(users,function(user){
				user.subscriptionStart = user.subscriptionStart?moment(user.subscriptionStart).format(self.dataFormat):moment().format(self.dataFormat);
				user.subscriptionEnd =  user.subscriptionEnd?moment(user.subscriptionEnd).format(self.dataFormat):moment().add(3, 'month').format(self.dataFormat);
				return user;
			});
            this.$el.find("#pendingAccount").html(_.template(PendingTemplate)({users:users, current:this.pendingChoosed }));
			this.$el.find("#pendingAccount .customTable tr").each(function(index){
				if (index){
					var start = $(this).find("input").eq(0);
					var end = $(this).find("input").eq(1);
					
					start.datepicker({
						dateFormat: 'dd M yy',
						beforeShow: function(input, inst) {
							$('#ui-datepicker-div').addClass("usersPick");
						},
						onSelect: function (selected) {
							end.datepicker("option", "minDate", new Date(selected));
						},
						maxDate:moment(users[index-1].subscriptionEnd,self.dataFormat)._d
					});
					end.datepicker({
						dateFormat: 'dd M yy',
						beforeShow: function(input, inst) {
							$('#ui-datepicker-div').addClass("usersPick");
						},
						onSelect: function (selected) {
							start.datepicker("option", "maxDate",  new Date(selected));
						},
						minDate:moment(users[index-1].subscriptionStart,self.dataFormat)._d
					});
				}
			});
			//			this.$el.find("#pendingAccount .customTable input").datepicker({ dateFormat: 'dd M yy' });
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

			//this.$el.find("#confirmedAccount .customTable input").datepicker({ dateFormat: 'dd M yy' });

			this.$el.find("#confirmedAccount .customTable tr").each(function(index){
				if (index){
					var start = $(this).find("input").eq(0);
					var end = $(this).find("input").eq(1);



					if (moment(end.val())._d < moment().add(7, 'days')._d) {
						end.closest('td').addClass('beforeExpired');

						if (moment(end.val())._d < moment().hour(25)._d) {
							end.closest('td').removeClass('beforeExpired').addClass('expired');
						}
					}
					start.datepicker({
						dateFormat: 'dd M yy',
						onSelect: function (selected) {
							end.datepicker("option", "minDate", new Date(selected));
						},
						beforeShow: function (input, inst) {
							$('#ui-datepicker-div').addClass("usersPick");
						},
						maxDate: moment(users[index - 1].subscriptionEnd, self.dataFormat)._d
					});
					end.datepicker({
						dateFormat: 'dd M yy',
						onSelect: function (selected) {
							start.datepicker("option", "maxDate", new Date(selected));
						},
						beforeShow: function (input, inst) {
							$('#ui-datepicker-div').addClass("usersPick");
						},
						minDate: moment(users[index - 1].subscriptionStart, self.dataFormat)._d
					});
				}
			});
            return this;
        },
		
        render: function () {
            this.$el.html(_.template(UsersTemplate));
            return this;
        }

    });

    return View;

});
