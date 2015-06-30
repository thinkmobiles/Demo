define([
    'text!templates/home/videoModalTemplate.html',
    'text!templates/home/relatedVideo.html',
	    'text!templates/home/pdfTemplate.html'
], function ( modalTemplate, relatedVideo, pdfTemplate) {

    var View;

    View = Backbone.View.extend({
        el:"#wrapper",
        events: {
            "click .pdf": "trackDocument",
            "click .ui-dialog-titlebar-close":"closeDialog",
			"click .questionSection table .checkbox" : "checkedQuestion",
			"ended .mainVideo":"endedMainVideo",
			"click .showSurvay":"showSurvay",
			"click .listVideo li":"clickOnVideo"
        },


        initialize: function (options) {
			this.content = options.content;
			this.currentSurvay = [];
            this.render();
        },

		clickOnVideo:function(e){
			var index = $(e.target).closest("li").data("id");
			$(e.target).closest("ul").find("li.current").removeClass("current");
			$(e.target).closest("ul").find("li[data-id='"+index+"']").addClass("current");
			this.$el.find(".videoConatiner>video").attr("src",this.currentSurvay[index].videoUri);
			this.$el.find(".pdfList").html(_.template(pdfTemplate)({
				pdfUri:this.currentSurvay[index].pdfUri
			}));

			
		},
		
		endedMainVideo:function(e){
			$(".videoSection").hide();
			$(".questionSection").show();
		},

		showSurvay:function(e){
			var self = this;

			$(".error").removeClass("error");
			var hasError = false;
			$(".questionSection table tr:not(:first)").each(function(){
				if (!$(this).find(".checked").length){
					$(this).find(".checkbox").addClass("error");
					hasError = true;
				}
			});

			if (!$(".questionSection .veryImp.checked").length){
				$(".questionSection .veryImp").addClass("error");
				hasError = true;
			}
			
			if (hasError)return;

			
			$(".questionSection").hide();
			$(".relatedVideo").show();
			$(".veryImp.checked").each(function(){
				var index = $(this).closest("table").find("tr").index($(this).closest("tr"))-1;
				self.currentSurvay.push(self.content.toJSON().content.survey[index]);
			});
			$(".relatedVideo").html(_.template(relatedVideo)({
				videoList:self.currentSurvay
			}
			));
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

        trackDocument: function (e) {
            $(e.target).attr('href');

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
                contentId: this.content.toJSON()._id,
                //userId: //ToDo: user id
                data:{
                    videoId: this.content.toJSON().mainVideoUri,
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

        closeDialog:function(e){
            e.preventDefault();
            $(".register-dialog").remove();
            $(".watch-dialog").show();
            $(".watchDemo").show();
        },


        // render template (once! because google maps)
        render: function () {
            var formString = _.template(modalTemplate)({
				content:this.content.toJSON().content
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
