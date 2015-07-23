define([
    'text!templates/home/homeTemplate.html',
	'custom'
], function (HomeTemplate, Custom) {

    var View;

    View = Backbone.View.extend({
        className: "mainPage",
		el:"#wrapper",
        events: {
            "click .showModal":"showModal",
            "click .checkbox":"checkboxClick",
            "click .registration":"hideBlur",
			"click .lock.active":"login",
			"keyup .signIn .userName":"changeFieldUsername",
			"keyup .signIn .password":"changeField",
//			"change .signIn .userName":"showAvatar",
        },


        initialize: function (options) {
			this.options = options;
			this.videoId = options&&options.videoId?options.videoId:"55800aadcb7bb82c1f000002";
			this.userId = options&&options.userId?options.userId:"55800aadcb7bb82c1f000002";
			this.modal = null;
            this.render();
        },

		changeField:function(e){
			var self = this;
			if (e.keyCode === 13){
				self.$el.find(".lock.active").click();
			}
			if (self.$el.find(".signIn .userName").val()){
				self.$el.find(".signIn .username .inp").addClass("valid");
			}else{
				self.$el.find(".signIn .username .inp").removeClass("valid");
			}
			if (self.$el.find(".signIn .password").val()){
				self.$el.find(".signIn .pass .inp").addClass("valid");
			}else{
				self.$el.find(".signIn .pass .inp").removeClass("valid");
			}
			if (self.$el.find(".signIn .userName").val()&&self.$el.find(".signIn .password").val()){
				self.$el.find(".lock").addClass("active");
			}else{
				self.$el.find(".lock").removeClass("active");
			}
		},

		showAvatar:_.debounce(function(){
			
			var self = this;
			$.ajax({
                url: "/avatar/"+self.$el.find(".signIn .userName").val(),
                type: "GET",
                dataType: 'json',
                success: function (response) {
					if (response.avatar){
						self.$el.find(".signIn .ava img").attr("src", response.avatar);
					}else{
						self.$el.find(".signIn .ava img").attr("src", Custom.defaultImage);
					}
                },
                error: function (err) {
					self.$el.find(".signIn .ava img").attr("src", Custom.defaultImage);
				}
            });
		},300),
		
		changeFieldUsername:function(e){
			this.changeField(e);
			this.showAvatar();
		},

		hideBlur:function(e){
			$("body").removeClass("withLogin");
		},

		checkboxClick:function(e){
			$(e.target).closest(".checkbox").toggleClass("checked");
		},

        showModal:function(){
			Backbone.history.navigate("#/chooseViewer/"+this.videoId+"/"+this.userId, {trigger: true});
			/*if(this.modal){
				this.modal.undelegateEvents();
			}
			this.modal =new ModalView(this.options);*/
		},

		login:function(e){
			var self = this;
			var keepAlive = self.$el.find(".signIn .checkbox").hasClass("checked");
			$.ajax({
                url: "/login",
                type: "POST",
                dataType: 'json',
                data: {
					keepAlive: keepAlive,
                    userName: self.$el.find(".signIn .userName").val(),
                    pass: self.$el.find(".signIn .password").val()
                },
                success: function (response) {
					$("body").removeClass("withLogin");
					self.$el.find(".signIn .userName").removeClass("error");
					self.$el.find(".signIn .password").removeClass("error");
					App.updateUser(function(){
						Backbone.history.navigate("#/login",{ trigger:true })
					});
                },
                error: function (err) {
					self.$el.find(".signIn .username .inp").addClass("error");
					self.$el.find(".signIn .pass .inp").addClass("error");
				}
            });
		},

        render: function () {
            this.$el.html(_.template(HomeTemplate));
			if (this.options&&this.options.videoId&&this.options.userId&&!this.options.showedModal){
				Backbone.history.navigate("#/chooseViewer/"+this.videoId+"/"+this.userId, {trigger: true});
			}
            return this;
        }


    });
    return View;
});
