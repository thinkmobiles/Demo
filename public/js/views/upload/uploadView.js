define([
    'text!templates/upload/uploadTemplate.html',
    'text!templates/upload/surveyElement.html',
    './progressBarView',
    "validation"

], function (EditTemplate, surveyElement, progressBarView, validation) {
    var View = Backbone.View.extend({

        el: "#wrapper",
        events: {
            "click .removeContent": "remove",
            "click .decline": "decline",
            "click .save:not(.edit)": "save",
            "click .question": "addQuestion",
            //"click .question.editQuestion": "editQuestion",
            "click .collapseQuestions .collapseQuestion .edit": "openQuestion",
            "click .collapseQuestions .collapseQuestion .close": "removeQuestion",
            "click .uploadContainer.file": "browse",
            "change .uploadContainer.file input[type='file']": "changeFile",
            "change .uploadContainer input[type='text']": "changeInput",
            "keyup .uploadContainer input[type='text']": "changeInput",
            "click .uploadContainer.file input[type='file']": "clickOnFile",
            "click .link-dialog .ui-dialog-titlebar-close": "decline",
            "dragenter .uploadContainer.file input": "dragenter",
            "dragleave .uploadContainer.file input": "dragleave",
            "dragover .uploadContainer.file input": "dragover",
            "drop .uploadContainer.file input": "drop"
        },

        initialize: function () {
            window.addEventListener("dragover", function (e) {
                e = e || event;
                e.preventDefault();
            }, false);
            window.addEventListener("drop", function (e) {
                e = e || event;
                e.preventDefault();
            }, false);
            this.countQuestion = 0;
            var self = this;
            self.render();
        },

        drop: function (e) {
            e.stopPropagation();
            e.preventDefault();
            var files = e.originalEvent.dataTransfer.files;

            if (($(e.target).closest(".uploadContainer").find("input[type='file']").attr("name").indexOf("video") !== -1 && e.originalEvent.dataTransfer.files.length === 1 && e.originalEvent.dataTransfer.files[0].type.indexOf("video") !== -1) || ($(e.target).closest(".uploadContainer").find("input[type='file']").attr("name").indexOf("file") !== -1 && e.originalEvent.dataTransfer.files[0].type.indexOf("application/pdf") !== -1) || ($(e.target).closest(".uploadContainer").find("input[type='file']").attr("name").indexOf("logo") !== -1 && e.originalEvent.dataTransfer.files.length === 1 && e.originalEvent.dataTransfer.files[0].type.indexOf("image") !== -1)) {
                $(e.target).closest(".uploadContainer").find("input[type='file']").prop("files", e.originalEvent.dataTransfer.files);
            } else {
                App.notification('Invalid file format')
            }
            $(e.target).closest(".uploadContainer").css('border', '1px solid #DBDBDB');

        },

        dragenter: function (e) {
            e.stopPropagation();
            e.preventDefault();
            $(e.target).closest(".uploadContainer").css('border', '2px solid #0B85A1');
        },
        dragleave: function (e) {
            console.log("leave");
            e.stopPropagation();
            e.preventDefault();
            $(e.target).closest(".uploadContainer").css('border', '1px solid #DBDBDB');
        },

        save: function (e) {
            var self = this;
            e.preventDefault();
            this.$el.find(".error").removeClass("error");
            var hasError = false;
            var message = '';
            var format = 'mp4 WebM Ogg';


            //nameOfCampaign
            if (!this.$el.find("input[name='nameOfCampaign']").val()) {
                this.$el.find("input[name='nameOfCampaign']").addClass("error");
                message = (message == '') ? "Please input name of campaign" : message;
                hasError = true;
            } else if (!validation.validLength(this.$el.find("input[name='nameOfCampaign']").val(), 2, 50)) {
                this.$el.find("input[name='nameOfCampaign']").addClass("error");
                message = (message == '') ? "Campaign name is not a valid. Character`s number should be from 2 to 20" : message;
                hasError = true;
            } else if (!validation.validName(this.$el.find("input[name='nameOfCampaign']").val(), 2, 50)) {
                this.$el.find("input[name='nameOfCampaign']").addClass("error");
                message = (message == '') ? "Campaign name is not valid. Field should contain only the following symbols: a-z, A-Z" : message;
                hasError = true;
            }

            //description
            if (!this.$el.find("textarea[name='desc']").val()) {
                this.$el.find("textarea[name='desc']").addClass("error");
                message = (message == '') ? "Please input some brief description" : message;
                hasError = true;
            } else if (!validation.validLength(this.$el.find("textarea[name='desc']").val(), 2, 300)) {
                this.$el.find("textarea[name='desc']").addClass("error");
                message = (message == '') ? "Description is not a valid. Character`s number should be from 2 to 300" : message;
                hasError = true;
            } else if (!validation.validComment(this.$el.find("textarea[name='desc']").val())) {
                this.$el.find("textarea[name='desc']").addClass("error");
                message = (message == '') ? "Description is not valid. Field should contain only the following symbols: \"a-z, A-Z, 0-9,!,?\"" : message;
                hasError = true;
            }

            //main video
            var videoName = this.$el.find(".mainVideoContainer.right .uploadContainer input[type='file']").get(0).files.length ? self.getFiles(this.$el.find(".mainVideoContainer.right .uploadContainer input[type='file']").get(0).files) : (this.$el.find(".mainVideoContainer.right .uploadContainer.file input[type='text']").val() ? this.$el.find(".mainVideoContainer.right .uploadContainer.file input[type='text']").val() : this.$el.find(".mainVideoContainer.right .uploadContainer.link input[type='text']").val());
            if (!videoName) {
                message = (message == '') ? "Please upload main video or past direct link to it" : message;
                this.$el.find(".mainVideoContainer.right .uploadContainer").addClass("error");
                hasError = !0;
            }else if (!this.$el.find(".mainVideoContainer.right .uploadContainer input[type='file']").get(0).files.length) {
                var link = this.$el.find(".mainVideoContainer.right .uploadContainer.link input[type='text']").val();

                if (!validation.validURL(link) || format.indexOf(link.split('.').pop()) == -1) {
                    message = (message == '') ? "Main video link is not valid" : message;
                    this.$el.find(".mainVideoContainer.right .uploadContainer .link").addClass("error");
                    hasError = !0;
                }
            }

            //logo
            var logoName = this.$el.find(".logoContainer .uploadContainer input[type='file']").get(0).files.length ? self.getFiles(this.$el.find(".logoContainer .uploadContainer input[type='file']").get(0).files) : "";
            if (!logoName) {
                message = (message == '') ? "Please upload logo" : message;
                this.$el.find(".logoContainer .uploadContainer").addClass("error");
                hasError = !0;
            }

            //company name
            if (!this.$el.find(".uploadContainer input[name='name']").val()) {
                message = (message == '') ? "Please input company name" : message;
                this.$el.find(".uploadContainer input[name='name']").closest(".uploadContainer").addClass("error");
                hasError = true;
            } else if (!validation.validLength(this.$el.find(".uploadContainer input[name='name']").val(), 2, 50)) {
                message = (message == '') ? "Company name is not a valid. Character`s number should be from 2 to 20" : message;
                this.$el.find(".uploadContainer input[name='name']").closest(".uploadContainer").addClass("error");
                hasError = true;
            } else if (!validation.validOrg(this.$el.find(".uploadContainer input[name='name']").val())) {
                message = (message == '') ? "Company name is not a valid. Field should contain only the following symbols: a-z, A-Z" : message;
                this.$el.find(".uploadContainer input[name='name']").closest(".uploadContainer").addClass("error");
                hasError = true;
            }

            //email
            if (!this.$el.find("input[name='email']").val()) {
                this.$el.find(".uploadContainer input[name='email']").closest(".uploadContainer").addClass("error");
                message = (message == '') ? "Please input email" : message;
                hasError = true;
            } else if (!validation.validEmail(this.$el.find("input[name='email']").val())) {
                message = (message == '') ? (self.$el.find(".uploadContainer input[name='email']").val() + " is not a valid email.") : message;
                this.$el.find(".uploadContainer input[name='email']").closest(".uploadContainer").addClass("error");
                hasError = true;
            }

            //phone
            if (!this.$el.find("input[name='phone']").val()) {
                this.$el.find("input[name='phone']").closest(".uploadContainer").addClass("error");
                message = (message == '') ? "Please input phone number" : message;
                hasError = true;
            } else if (!validation.validPhone(this.$el.find("input[name='phone']").val())) {
                this.$el.find("input[name='phone']").closest(".uploadContainer").addClass("error");
                message = (message == '') ? "That is not a valid phone number. It should contain only numbers and '+ - ( )' signs" : message;
                hasError = true;
            }


            if (!this.$el.find(".canSort").length) {
                message = (message == '') ? "Please create survey question" : message;
                hasError = !0;
            }

            if (hasError) {
                App.notification(message);
                return;
            }


            var form = document.forms.namedItem("videoForm");

            var oData = new FormData(form);
            var oReq = new XMLHttpRequest();
            this.xhr = oReq;
            if (this.modalProgres) {
                this.modalProgres.undelegateEvents();
            }

            this.modalProgres = new progressBarView(this.xhr);

            oReq.upload.addEventListener("progress", function (evt) {
                if (evt.lengthComputable) {
                    self.percentComplete = evt.loaded / evt.total;
                    self.percentComplete = parseInt(self.percentComplete * 100);

                    if (self.percentComplete === 100) {
                        //remove dialog
                        $(document).find('#bar_container').hide();
                        $(document).find('#rendering').fadeIn();
                        //self.modalProgres.hide();
                    }
                }
            }, false);
            //============================================================
            oReq.upload.addEventListener('progress', visualEffectHandler, false);

            function visualEffectHandler() {
                var value = self.percentComplete;
                $('#progress_bar').val(value);

                $('.progress-value').html(value + '%');
                var deg = 360 * value / 100;
                if (value > 50) {
                    $('.progress-pie-chart').addClass('gt-50');
                }

                $('.ppc-progress-fill').css('transform', 'rotate(' + deg + 'deg)');
                $('.ppc-percents span').html(value + '%');
            };

            //============================================================


            oReq.open("POST", "content/upload", true);
            oReq.onload = function (oEvent) {
                if (oReq.status === 201) {
                    try {
                        self.modalProgres.hide();
                        var res = JSON.parse(oReq.response);
                        if (App.sessionData.get('role') == 0) {
                            App.sessionData.set('campaigns', [{_id: res.id}]);
                            Backbone.history.navigate("#/home", {trigger: true});
                            return;
                        }
                        Backbone.history.navigate("#/campaigns", {trigger: true});
                    }
                    catch (e) {
                        App.notification(e);
                    }
                } else {
                    try {
                        App.notification(JSON.parse(oReq.responseText).error);
                        self.modalProgres.hide()
                    } catch (e) {
                        Backbone.history.navigate("#/home", {trigger: true});
                        App.notification('Some error occurs');
                    }
                }
            };
            oReq.send(oData);
        },

        decline: function (e) {
            e.preventDefault();
            if (App.sessionData.get('role') == 0) {
                Backbone.history.navigate("#/home", {trigger: true});
                return;
            }
            Backbone.history.navigate("#/campaigns", {trigger: true});
        },

        changeInput: function (e) {
            if ($(e.target).val()) {
                if ($(e.target).closest(".uploadContainer").hasClass('link')) {
                    var input = $(e.target).closest(".right").find(".uploadContainer.file input[type='file']");
                    $(e.target).closest(".right").find(".uploadContainer.file input[type='text']").val('');
                    $(e.target).closest(".right").find(".uploadContainer.file .right").removeClass('active');
                    input.replaceWith(input.clone());
                } else {
                    $(e.target).closest(".right").find(".uploadContainer.link input[type='text']").val('');
                    $(e.target).closest(".right").find(".uploadContainer.link .right").removeClass('active');
                }
                $(e.target).parents(".uploadContainer").find(".right").addClass("active");
            } else {
                $(e.target).parents(".uploadContainer").find(".right").removeClass("active");
            }
        },

        removeQuestion: function (e) {
            var countQuestion = this.$el.find(".survey:not(.new)").length;
            var current = $(e.target).closest(".survey");
            var n = this.$el.find(".collapseQuestions .survey").index(current);
            this.$el.find(".videoContainer .survey").each(function (index) {
                if (index > n) {
                    $(this).find(".videoElement .questionText").attr("name", "question" + index);
                    $(this).find(".videoElement .right .uploadContainer.file input[type='file']").attr("name", "video" + index);
                    $(this).find(".videoElement .right .uploadContainer.link input").attr("name", "video" + index);
                    $(this).find(".videoElement .left .uploadContainer.file input[type='file']").attr("name", "file" + index);
                }
            });
            $(this.$el).find(".countQuestion").val(countQuestion);
            current.remove();
        },

        clickOnFile: function (e) {
            e.stopPropagation();
        },


        addQuestion: function (e) {
            var self = this;
            var hasError = false;
            e.preventDefault();
            $(".error").removeClass("error");
            var message = '';
            var format = 'mp4 WebM Ogg';

            var videoName = $(e.target).closest(".videoElement").find(".right .uploadContainer input[type='file']").get(0).files.length ? self.getFiles($(e.target).closest(".videoElement").find(".right .uploadContainer input[type='file']").get(0).files) : $(e.target).closest(".videoElement").find(".right .uploadContainer.link input[type='text']").val();
            var pdfName = $(e.target).closest(".videoElement").find(".left input[type='file']").get(0).files.length ? self.getFiles($(e.target).closest(".videoElement").find(".left input[type='file']").get(0).files) : '';

            //description
            if (!$(e.target).closest(".videoElement").find(".questionText").val().trim()) {
                message = (message == '') ? "Please input some brief description to survey" : message;
                $(e.target).closest(".videoElement").find(".questionText").addClass("error");
                hasError = !0;
            } else if (!validation.validLength($(e.target).closest(".videoElement").find(".questionText").val().trim(), 2, 300)) {
                message = (message == '') ? "Description is not a valid. Character`s number should be from 2 to 300" : message;
                $(e.target).closest(".videoElement").find(".questionText").addClass("error");
                hasError = !0;
            } else if (!validation.validComment($(e.target).closest(".videoElement").find(".questionText").val().trim())) {
                message = (message == '') ? "Description is not valid. Field should contain only the following symbols: \"a-z, A-Z, 0-9, !, ?\"" : message;
                $(e.target).closest(".videoElement").find(".questionText").addClass("error");
                hasError = !0;
            }

            //video
            if (!videoName) {
                message = (message == '') ? "Please upload some video or past direct link to it" : message;
                $(e.target).closest(".videoElement").find(".right .uploadContainer").addClass("error");
                hasError = !0;
            } else if (!$(e.target).closest(".videoElement").find(".right .uploadContainer input[type='file']").get(0).files.length) {
                var link = $(e.target).closest(".videoElement").find(".right .uploadContainer.link input[type='text']").val();

                if (!validation.validURL(link) || format.indexOf(link.split('.').pop()) == -1) {
                    message = (message == '') ? "Link is not valid" : message;
                    $(e.target).closest(".videoElement").find(".right .uploadContainer .link").addClass("error");
                    hasError = !0;
                }
            }

            if (hasError) {
                App.notification(message);
                return;
            }

            var countQuestion = this.$el.find(".survey").length;
            $(e.target).closest(".question").addClass('editQuestion').text("SAVE");
            $(e.target).closest(".survey").addClass('canSort').removeClass("new");
            $(e.target).closest(".survey").find('.collapseQuestion h2').text($(e.target).closest(".videoElement").find(".questionText").val());
            $(e.target).closest(".survey").find('.collapseQuestion .relatedVideo').html("Related video: <b>" + videoName + "</b>");
            if (pdfName) {
                $(e.target).closest(".survey").find('.collapseQuestion .relatedPdf').html("Related PDF: <b>" + pdfName + "</b>");
            }
            $(e.target).closest(".survey").find(".collapseQuestion").removeClass("hidden");
            $(e.target).closest(".videoElement").hide();

            this.$el.find(".collapseQuestions").append(_.template(surveyElement)({index: countQuestion + 1}));
            this.$el.find(".countQuestion").val(countQuestion);

        },


        openQuestion: function (e) {
            this.$el.find(".survey.new").remove();
            this.$el.find(".survey .collapseQuestion").removeClass('hidden');
            $(e.target).closest(".survey").find('.collapseQuestion').addClass('hidden');
            this.$el.find(".videoElement").slideUp();
            $(e.target).closest(".survey").find('.videoElement').delay(200).slideDown();

        },

        browse: function (e) {
            $(e.target).closest(".uploadContainer").find("input[type='file']").click();
        },

        getFiles: function (files) {
            var s = "";
            for (var i = 0; i < files.length; i++) {
                s += files[i].name + " "
            }
            return s;
        },

        validPdfs: function (files) {
            for (var i = 0; i < files.length; i++) {
                if (files[i].name.split('.').pop() !== "pdf") {
                    return false;
                }
            }
            return true;
        },

        changeFile: function (e) {
            var self = this;
            var hasError = false;
            var message = '';
            var videoFormat = 'mp4 WebM Ogg';

            $(e.target).closest(".uploadContainer").find("input[type='text']").val(self.getFiles($(e.target).get(0).files)).change();

            var inpName = $(e.target).attr("name");
            if (inpName.indexOf('video') != -1) {
                var videoName = $(e.target).get(0).files.length ? self.getFiles($(e.target).get(0).files) : "";
                if ($(e.target).get(0).files.length && videoFormat.indexOf(videoName.split('.').pop()) == -1) {
                    message = (message == '') ? "Video format is not valid" : message;
                    hasError = !0;
                }
            } else if (inpName.indexOf('file') != -1) {
                var pdfName = $(e.target).get(0).files.length ? self.getFiles($(e.target).get(0).files) : "";
                if (pdfName && !self.validPdfs($(e.target).get(0).files)) {
                    message = (message == '') ? "Pdf files is not valid" : message;
                    hasError = !0;
                }
            }
            if ($(e.target).attr("name") === "logo") {
                var input = e.target;
                if (!input.files || !input.files[0] || !input.files[0].size || input.files[0].type.indexOf('image') === -1) {
                    message = (message == '') ? "Invalid file type. An uploaded image must be in GIF, JPEG, or PNG format." : message;
                    hasError = !0;
                } else {

                    var reader = new FileReader();
                    reader.onload = function (event) {
                        self.drawImage(event.target.result);
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            }
            if (hasError) {
                $(e.target).closest(".uploadContainer.file").addClass('error');
                $(e.target).closest(".uploadContainer.file").find(".left input[type='text']").val('');
                $(e.target).closest(".uploadContainer.file").find(".right").removeClass('active');
                var fileInput = $(e.target);
                fileInput.replaceWith(fileInput.clone());
                App.notification(message);
                return;
            }
        },

        render: function () {
            this.$el.html(_.template(EditTemplate)({role: App.sessionData.get('role')}));
            $("#sortable").sortable({
                cursor: "move",
                //cursorAt: { top: 70 },
                items: "> div.canSort",
                opacity: 0.8,
                revert: true,
                scroll: false,
                containment: '.login',
                placeholder: 'sortable-placeholder',
                disabled: false,
                beforeStop: function (e) {
                    $(e.target).closest('.videoContainer').find(".survey").each(function (i) {
                        var index = i + 1;
                        $(this).find(".videoElement .questionText").attr("name", "question" + index);
                        $(this).find(".videoElement .right .uploadContainer.file input[type='file']").attr("name", "video" + index);
                        $(this).find(".videoElement .right .uploadContainer.link input").attr("name", "video" + index);
                        $(this).find(".videoElement .left .uploadContainer.file input[type='file']").attr("name", "file" + index);
                    });
                }
            });
            return this;
        },
        drawImage: function (src) {
            this.$el.find("#preview").show();
            this.$el.find("#arrowPreview").show();
            var myImage = new Image(100, 100);
            myImage.src = src;
            myImage.onload = function () {
                var c = document.getElementById("preview");
                var ctx = c.getContext("2d");
                ctx.clearRect(0, 0, c.width, c.height);
                ctx.drawImage(myImage, 0, 0, 100, 100);
            };
        }
    });

    return View;
});
