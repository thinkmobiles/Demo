define([
    'text!templates/home/videoModalTemplate.html',
    'text!templates/home/relatedVideo.html',
    "models/userModel"
], function ( modalTemplate, relatedVideo, UserModel) {

    var View;

    View = Backbone.View.extend({
        el:"#wrapper",
        events: {
            "click .ui-dialog-titlebar-close":"closeDialog",
            "click .continue":"register",
			"click .questionSection table .checkbox" : "checkedQuestion",
			"ended .mainVideo":"endedMainVideo",
			"click .showSurvay":"showSurvay"
        },


        initialize: function (options) {
			this.company = options.company;
            this.render();
        },

		endedMainVideo:function(e){
			$(".videoSection").hide();
			$(".questionSection").show();
            //sendAjax();
		},

		showSurvay:function(e){
			$(".questionSection").hide();
			$(".relatedVideo").show();
			$(".relatedVideo").html(_.template(relatedVideo)(this.company.toJSON().survey[0]));
		},

		checkedQuestion: function(e){
			$(e.target).parents("tr").find(".checked").removeClass("checked");
			$(e.target).addClass("checked");
		},
        range: function () {
            var video = document.getElementsByTagName('video')[0];
            var ranges = [];
            var time_ranges = video.played;
            for (var i=0; i < time_ranges.length; i++) {
                var range = {};
                range.start = Math.round(time_ranges.start(i));
                range.end = Math.round(time_ranges.end(i));
                ranges.push(range);
            }
            console.log(ranges);
            console.log(time_ranges);

        },
        sendAjax: function(){
            var video =this.$el.find(".mainVideo")[0];
            var time_ranges = video.played;
            var ranges = [];
            //var pos = video.currentSrc.indexOf('video');
            //var videoId = decodeURI(video.currentSrc.slice(pos));

            for (var i=0; i < time_ranges.length; i++) {
                var range = {};
                range.start = Math.round(time_ranges.start(i));
                range.end = Math.round(time_ranges.end(i));
                ranges.push(range);
            }
            var videoData = {
                companyId: this.company.toJSON()._id,
                //userId: //ToDo: user id
                data:{
                    videoId: this.company.toJSON().mainVideoUri,
                    rangeWatched: ranges
                }
            };
            $.ajax({
                type: "POST",
                url: "/testTrackVideo",
                data: JSON.stringify(videoData),
                contentType: "application/json",

                success: function (msg) {
                    if (msg) {
                        console.log('Successfully send')
                    } else {
                        console.log("Cant track the video");
                    }
                },
                error: function (model, xhr) {
                    console.log(xhr);
                    console.log(model);

                }
            });
        },

        register: function(){
            var userModel = new UserModel();
            userModel.save({
                    email : this.$el.find("#email").val(),
                    firstName : this.$el.find("#fname").val(),
                    lastName : this.$el.find("#lname").val(),
                    phone : this.$el.find("#phone").val(),
                    organization : this.$el.find("#organization").val(),
                    title : this.$el.find("#title").val(),
                    comments : this.$el.find("#comments").val()
                },
                {
                    wait: true,
                    success: function (model, response) {
                        alert("OK!")
                    },
                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }
                });
        },

        closeDialog:function(e){
            e.preventDefault();
            $(".register-dialog").remove();
            $(".watch-dialog").show();
            $(".watchDemo").show();
        },


        // render template (once! because google maps)
        render: function () {
            var formString = _.template(modalTemplate)({
				company:{
					mainVideoUri:this.company.toJSON().mainVideoUri.replace('public\\',''),
					logoUri:this.company.toJSON().logoUri.replace('public\\',''),
					survey:this.company.toJSON().survey
				}
            });
            this.dialog = $(formString).dialog({
                modal:true,
                closeOnEscape: false,
                appendTo:"#wrapper",
                dialogClass: "register-dialog",
                width: 1180
            });
			this.$el.find(".mainVideo").on('ended',this.endedMainVideo);
            return this;
        }


    });
    return View;
});
