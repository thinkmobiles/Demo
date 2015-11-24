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

            if (!this.$el.find(".uploadContainer input[name='nameOfCampaign']").val()) {
                this.$el.find(".uploadContainer input[name='nameOfCampaign']").addClass("error");
                message = (message == '') ? "Please input name of campaign" : message;
                hasError = true;
            }

            if (!this.$el.find("textarea[name='desc']").val()) {
                this.$el.find("textarea[name='desc']").addClass("error");
                message = (message == '') ? "Please input some brief description" : message;
                hasError = true;
            }

            if (!this.$el.find(".uploadContainer.file input[name='video']").val() && !this.$el.find(".uploadContainer.link input[name='video']").val()) {
                this.$el.find(".uploadContainer.file input[name='video']").closest(".uploadContainer").addClass("error");
                this.$el.find(".uploadContainer.link input[name='video']").closest(".uploadContainer").addClass("error");
                message = (message == '') ? "Please choose video" : message;
                hasError = true;
            }

            if (!this.$el.find(".uploadContainer.file input[name='logo']").val()) {
                this.$el.find(".uploadContainer.file input[name='logo']").closest(".uploadContainer").addClass("error");
                message = (message == '') ? "Please upload logo" : message;
                hasError = true;
            }

            if (!this.$el.find(".uploadContainer input[name='name']").val()) {
                this.$el.find(".uploadContainer input[name='name']").closest(".uploadContainer").addClass("error");
                message = (message == '') ? "Please input company name" : message;
                hasError = true;
            }


            if (!this.$el.find("input[name='email']").val()) {
                this.$el.find(".uploadContainer input[name='email']").closest(".uploadContainer").addClass("error");
                message = (message == '') ? "Please input email" : message;
                hasError = true;
            }

            if (!validation.validEmail(this.$el.find("input[name='email']").val())) {
                this.$el.find(".uploadContainer input[name='email']").closest(".uploadContainer").addClass("error");
                message = (message == '') ? (self.$el.find(".uploadContainer input[name='email']").val() + " is not a valid email.") : message;
                hasError = true;
            }

            if (!this.$el.find("input[name='phone']").val()) {
                this.$el.find("input[name='phone']").closest(".uploadContainer").addClass("error");
                message = (message == '') ? "Please input phone number": message;
                hasError = true;
            }

            if (!validation.validPhone(this.$el.find("input[name='phone']").val())) {
                this.$el.find("input[name='phone']").closest(".uploadContainer").addClass("error");
                message = (message == '') ? "That is not a valid phone number. It should contain only numbers and '+ - ( )' signs" : message;
                hasError = true;
            }

            if (!$(e.target).closest(".videoContainer").find(".canSort").length) {
                $(e.target).closest(".videoContainer").find(".questionText").addClass("error");
                $(e.target).closest(".videoContainer").find(".right .uploadContainer").addClass("error");
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
                        $("<div><input type='text' value='" + res.url + "' readonly/></div>").dialog({
                            modal: true,
                            closeOnEscape: false,
                            appendTo: "#wrapper",
                            dialogClass: "link-dialog",
                            width: 725
                        });
                        //window.location="/#home";
                        self.$el.find()
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
            Backbone.history.navigate("#/campaigns", {trigger: true});
        },

        changeInput: function (e) {
            if ($(e.target).val()) {
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

            var videoName = $(e.target).closest(".videoElement").find(".right .uploadContainer input[type='file']").get(0).files.length ? self.getFiles($(e.target).closest(".videoElement").find(".right .uploadContainer input[type='file']").get(0).files) : $(e.target).closest(".videoElement").find(".right .uploadContainer.link input[type='text']").val();
            var pdfName = $(e.target).closest(".videoElement").find(".left input[type='file']").get(0).files.length ? self.getFiles($(e.target).closest(".videoElement").find(".left input[type='file']").get(0).files) : '';

            if (!$(e.target).closest(".videoElement").find(".questionText").val().trim()) {
                $(e.target).closest(".videoElement").find(".questionText").addClass("error");
                hasError = !0;
            }
            if (!videoName) {
                $(e.target).closest(".videoElement").find(".right .uploadContainer").addClass("error");
                hasError = !0;
            }
            if (!videoName) {
                $(e.target).closest(".videoElement").find(".right .uploadContainer").addClass("error");
                hasError = !0;
            }
            if (!hasError) {
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

                this.$el.find(".collapseQuestions").append(_.template(surveyElement)({index: countQuestion+1}));
                this.$el.find(".countQuestion").val(countQuestion);
            }
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

        changeFile: function (e) {
            var self = this;
            $(e.target).closest(".uploadContainer").find("input[type='text']").val(self.getFiles($(e.target).get(0).files)).change();

            if ($(e.target).attr("name") === "logo") {
                var reader = new FileReader();
                reader.onload = function (event) {
                    self.drawImage(event.target.result);
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        },

        render: function () {
            this.$el.html(_.template(EditTemplate));
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
