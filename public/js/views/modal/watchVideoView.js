define([
    'text!templates/home/videoModalTemplate.html',
    'text!templates/home/relatedVideo.html',
    'text!templates/home/pdfTemplate.html',
    'custom',
    'constants'
], function (modalTemplate, relatedVideo, pdfTemplate, custom, CONSTANTS) {

    var View;

    View = Backbone.View.extend({
        el: "#topMenu",
        events: {
            "click .pdf": "trackDocument",
            "click .questionSection table .checkbox": "checkedQuestion",
            "click .showSurvay": "showSurvey",
            "click .listVideo li": "clickOnVideo",
            "click .ui-dialog-titlebar-close": "clickOnClose",
            "click .contactMe": "contactMe",
            "click .social .fb": "shareOnFacebook",
            "click .social .in": "shareOnLinkedIn",
            "click .hoverList": "showList",

            "mousemove .surveyVideo": "toggleArrow",
            "mouseleave .surveyVideo": "hideArrow",
            "mouseenter .hoverList": "showArrow",
            "mouseenter .listVideo": "showList",
            "mouseleave .listVideo": "hideList",
            "mouseleave .hoverList": "hideArrow"
        },

        initialize: function (options) {
            var self = this;
            this.videoId = options && options.videoId ? options.videoId : "";
            this.userId = options && options.userId ? options.userId : "";
            this.indexList = options && options.indexList ? options.indexList : [];
            var page = options && options.page ? options.page : null;
            this.currentSurvay = [];


            window.addEventListener("beforeunload", function () {
                var videoEl = self.$el.find(".surveyVideo")[0] || self.$el.find(".mainVideo")[0];
                self.trackVideo(videoEl, false);
                console.log(videoEl.currentTime);
                return 'are you sure';
            });
            App.getContent(this.videoId, this.userId, function (content) {
                self.content = content;
                self.render();
                if (page === "important") {
                    $(".mainVideo").trigger("pause");
                    $(".videoSection").remove();
                    $(".questionSection").show();
                    $(".watch-dialog").removeClass('video-dialog');
                }
                if (page === "related") {
                    $(".mainVideo").trigger("pause");
                    $(".videoSection").remove();
                    $(".relatedVideo").show();
                    var indexList = options && options.indexList ? options.indexList : null;
                    if (indexList) {
                        indexList = indexList.split(",");
                        for (var i = 0; i < indexList.length; i++) {
                            self.currentSurvay.push(self.content.toJSON().content.survey[indexList[i]])
                        }
                    } else {
                        self.currentSurvay = self.content.toJSON().content.survey;
                    }
                    $(".relatedVideo").html(_.template(relatedVideo)({
                        videoList: self.currentSurvay
                    }));
                    $(".custom-scroll").mCustomScrollbar();
                    self.$el.find("video").on('ended', function () {
                        var videoEl = self.$el.find(".surveyVideo")[0];
                        self.trackVideo(videoEl, true);
                    });
                }
            });
        },

        showList: function (e) {
            var self = this;
            self.$el.find(".listVideo").stop();
            self.$el.find(".hoverList span").stop().animate({opacity: 0}, 100);
            self.$el.find(".listVideo").stop().animate({opacity: 1, marginRight: 0}, 500);
        },

        hideList: function (e) {
            var self = this;
            self.$el.find(".listVideo").stop().delay(1500).animate({opacity: 0, marginRight: -130}, 500);
            self.$el.find(".hoverList span").stop().animate({opacity: 0}, 100);
        },

        showArrow: function (e) {
            var self = this;
            self.$el.find(".hoverList span").stop().animate({opacity: 1}, 400);
        },

        toggleArrow: function (e) {
            var self = this;
            self.$el.find(".hoverList span").stop().animate({opacity: 0.3}, 100);
        },
        hideArrow: function (e) {
            var self = this;
            self.$el.find(".hoverList span").stop().animate({opacity: 0}, 400);
        },

        shareOnFacebook: function () {
            var self = this;
            console.log(window.location.origin + "/" + self.content.toJSON().content.logoUri);
            FB.ui(
                {
                    method: 'feed',
                    name: CONSTANTS.FB_SHARE_NAME,
                    link: window.location.href.replace("chooseImportant", "home").replace('watchVideo', 'home').replace('relatedVideo', 'home'),
                    picture: self.content.toJSON().content.logoUri,
                    caption: '',
                    description: self.content.toJSON().content.mainVideoDescription
                },
                function (response) {
                    if (response && response.post_id) {
                    } else {
                        console.log('Post was not published.');
                    }
                }
            );
        },

        shareOnLinkedIn: function () {
            var self = this;
            var options = {
                "content": {
                    "title": CONSTANTS.IN_SHARE_NAME,
                    "description": self.content.toJSON().content.mainVideoDescription,
                    "submitted-url": window.location.href.replace("chooseImportant", "home").replace('watchVideo', 'home').replace('relatedVideo', 'home') + '\/f157640',
                    "submitted-image-url": self.content.toJSON().content.logoUri
                },
                "visibility": {
                    "code": "anyone"
                }
            };
            IN.User.authorize(function () {
                IN.API.Raw("/people/~/shares?format=json")
                    .method("POST")
                    .body(JSON.stringify(options))
                    .error(function (err) {
                        console.log(err);
                    });
            });

        },

        facebookAuth: function (callback) {

            FB.login(function (response) {

                if (response.authResponse) {
                    FB.api('/me?fields=id,name,email', function (user) {
                        if (!response || response.error) {
                            callback(response.error || 'FB.api /me error', null);
                        } else {
                            var userOut = {
                                firstName: user.name.split(" ")[0],
                                lastName: user.name.split(" ")[1],
                                url: 'https://www.facebook.com/' + user.id,
                                email: user.email
                            };

                            callback(null, userOut);
                        }
                    }, {scope: 'email'});

                } else {
                    callback('User cancelled login or did not fully authorize.', null)
                }
            }, {scope: 'email,publish_actions'});
        },

        linkedInAuth: function (callback) {

            IN.User.authorize(function (res, err) {
                if (err) {
                    callback(err, null)
                } else {
                    IN.API.Raw("/people/~:(id,firstName,lastName,public-profile-url,email-address)").result(function (user) {
                            var userOut;
                            userOut = {
                                firstName: user.firstName,
                                lastName: user.lastName,
                                url: user.publicProfileUrl,
                                email: user.emailAddress
                            };
                            callback(err, null);
                        }).error(function (err) {
                            callback(err, null)
                        });
                }
            });
        },

        contactMe: function () {
            if (!this.videoId && !this.userId) {
                return Backbone.history.navigate("#/contact", {trigger: true});
            }
            Backbone.history.navigate("#/contactMe/" + this.videoId + "/" + this.userId + "/" + window.location.hash.split("/")[1] + (this.indexList.length ? "/" + this.indexList : ""), {trigger: true});
        },

        clickOnClose: function () {
            var videoEl = this.$el.find(".surveyVideo")[0] || this.$el.find(".mainVideo")[0];
            this.trackVideo(videoEl, false);
            if (!this.videoId) {
                Backbone.history.navigate("/home");
            } else {
                Backbone.history.navigate("/home/" + this.videoId + "/" + this.userId);
            }

        },

        clickOnVideo: function (e) {
            var self = this;
            var videoEl = self.$el.find(".surveyVideo")[0];
            self.trackVideo(videoEl, false);
            var index = $(e.target).closest("li").data("id");
            $(e.target).closest("ul").find("li.current").removeClass("current");
            $(e.target).closest("ul").find("li[data-id='" + index + "']").addClass("current");
            this.$el.find(".videoConatiner>video").attr("src", self.currentSurvay[index].videoUri);
            this.$el.find(".pdfList").html(_.template(pdfTemplate)({
                pdfUri: self.currentSurvay[index].pdfUri
            }));
        },


        trackQuestion: function () {
            if (!this.videoId && !this.userId) {
                return;
            }
            var self = this;
            var questions = [];
            var obj;
            $('.questionSection .checked').each(function () {
                obj = {};
                obj.question = $(this).parents("tr").data('question');
                obj.item = $(this).data('item');
                questions.push(obj);
            });
            data = {
                userId: this.userId,
                contentId: this.videoId,
                questions: questions
            };
            $.ajax({
                type: "POST",
                url: "/track/question",
                data: JSON.stringify(data),
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
        showSurvey: function (e) {
            var self = this;
            var message = '';
            $(".error").removeClass("error");
            var hasError = false;
            $(".questionSection table tr:not(:first)").each(function () {
                if (!$(this).find(".checked").length) {
                    $(this).find(".checkbox").addClass("error");
                    message = message === '' ? 'Please make your choice for each question' : message;
                    hasError = true;

                }
            });
            if (hasError) {
                App.notification(message);
                return;
            }
            var indexList = [];
            $(".veryImp.checked").each(function () {
                indexList.push($(this).closest("table").find("tr").index($(this).closest("tr")) - 1);
            });
            $(".someImp.checked").each(function () {
                indexList.push($(this).closest("table").find("tr").index($(this).closest("tr")) - 1);
            });

            this.trackQuestion();
            var url = "#/relatedVideo/";
            if (this.videoId && this.userId) {
                url += this.videoId + "/" + this.userId + "/";
            }
            url += indexList.join(",");
            if (!indexList.length) {
                url='#/home';
                App.notification('Thank you for your feedback!')
            }
            Backbone.history.navigate(url, {trigger: true});

        },

        checkedQuestion: function (e) {
            $(e.target).parents("tr").find(".checked").removeClass("checked");
            $(e.target).addClass("checked");
        },
        range: function () {
            var video = document.getElementsByTagName('video')[0];
            var ranges = [];
            var time_ranges = video.played;
            for (var i = 0; i < time_ranges.length; i++) {
                var range = {};
                range.start = Math.round(time_ranges.start(i));
                range.end = Math.round(time_ranges.end(i));
                ranges.push(range);
            }
            console.log(ranges);
            console.log(time_ranges);

        },

        trackDocument: function (e) {
            if (!this.videoId && !this.userId) {
                return;
            }
            var document = $(e.target).attr('href');
            var data = {
                userId: this.userId,
                contentId: this.videoId,
                document: document
            };
            $.ajax({
                type: "POST",
                url: "/track/document",
                data: JSON.stringify(data),
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

        trackVideo: function (videoEl, isEnd) {
            if (!this.videoId && !this.userId) {
                return;
            }
            var video = videoEl.currentSrc;
            var stopTime = Math.round(videoEl.currentTime);

            var videoData = {
                userId: this.userId,
                contentId: this.videoId,
                data: {
                    video: video,
                    stopTime: stopTime,
                    end: isEnd || false
                }
            };
            $.ajax({
                type: "POST",
                url: "/track/video",
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

        closeDialog: function (e) {
            e.preventDefault();
            $(".register-dialog").remove();
            $(".watch-dialog").show();
            $(".watchDemo").show();
        },


        render: function () {
            var self = this;

            var formString = _.template(modalTemplate)({
                content: this.content.toJSON().content,
                host: CONSTANTS.PRODUCTION_HOST,
                videoId: self.videoId,
                prospectId: self.userId,
                page: window.location.hash.split("/")[1].replace("chooseImportant", "watchVideo")
            });
            this.dialog = $(formString).dialog({
                modal: true,
                resizable: false,
                draggable: false,
                closeOnEscape: false,
                appendTo: "#topMenu",
                dialogClass: "watch-dialog video-dialog",
                width: 1180,
                position: {
                    my: "center center",
                    at: "center center"
                },
                create: function (e) {
                    //$(e.target).parent().css({'position': 'fixed'});
                    $(document).find('.topMenu').addClass('small');
                    if (window.innerWidth <= 736) {
                        $(document).find('#wrapper').css({'display': 'none'});
                        $(document).find('#footer').css({'display': 'none'});
                    }
                }
            });

            setTimeout(function () {
                self.$el.find(".listVideo").stop().animate({opacity: 0, marginRight: -130}, 500);
            }, 3000);

            this.$el.find("video").on('ended', function () {
                var videoEl = self.$el.find(".mainVideo")[0];
                self.trackVideo(videoEl, true);
            });
            this.$el.find(".mainVideo").on('ended', function () {
                self.dialog.remove();
                custom.toUrl("chooseImportant", self.videoId, self.userId);
            });
            //FB.XFBML.parse();
            return this;
        }


    });
    return View;
});
