define([
    'text!templates/edit/editTemplate.html',
    'text!templates/edit/surveyElement.html',
    'text!templates/upload/surveyElement.html',
    '../upload/progressBarView',
    "validation"

], function (EditTemplate, SurveyElement, NewSurveyElement, progressBarView, validation) {
    var View = Backbone.View.extend({

        el: "#wrapper",
        events: {
            "click .removeContent": "remove",
            "click .decline": "decline",
            "click .save.edit": "update",
            "click .question": "addQuestion",
            "click .collapseQuestion .edit": "openQuestion",
            "click .collapseQuestions .collapseQuestion .close": "removeQuestion",
            "click .uploadContainer.file": "browse",
            "change .uploadContainer.file input[type='file']": "changeFile",
            "change .uploadContainer input[type='text']": "changeInput",
            "keyup .uploadContainer input[type='text']": "changeInput",
            "click .uploadContainer.file input[type='file']": "clickOnFile",
            "click .link-dialog .ui-dialog-titlebar-close": "decline",
            "click .editContent": "showEdit",
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
            this.removedQuestions = [];
            this.surveyOrder = [];
            var self = this;
            self.isEdit = false;
            $.ajax({
                type: "GET",
                url: "/content",
                contentType: "application/json",
                success: function (data) {
                    self.isEdit = true;
                    self.render(data)
                },
                error: function (model, xhr) {
                    Backbone.history.navigate("#/upload", {trigger: true});
                }
            });
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

        update: function (e) {
            var self = this;
            e.preventDefault();
            this.$el.find(".error").removeClass("error");
            var hasError = false;
            if (!this.$el.find("textarea[name='desc']").val()) {
                this.$el.find("textarea[name='desc']").addClass("error");
                hasError = true;
            }

            if (!validation.validPhone(this.$el.find("input[name='phone']").val())) {
                this.$el.find("input[name='phone']").closest(".uploadContainer").addClass("error");
                hasError = true;
            }

            if (!validation.validEmail(this.$el.find("input[name='email']").val())) {
                this.$el.find(".uploadContainer input[name='email']").closest(".uploadContainer").addClass("error");
                hasError = true;
            }

            if (!this.$el.find(".uploadContainer input[name='name']").val()) {
                this.$el.find(".uploadContainer input[name='name']").closest(".uploadContainer").addClass("error");
                hasError = true;
            }

            if (hasError) {
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
                        $(document).find('#bar_container').fadeOut();
                        $(document).find('#rendering').fadeIn();
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


            oReq.open("POST", "content/update", true);
            oReq.onload = function (oEvent) {
                if (oReq.status === 200) {
                    try {
                        self.modalProgres.hide()
                        var res = JSON.parse(oReq.response);
                        $("<div><input type='text' value='" + res.url + "' readonly/></div>").dialog({
                            modal: true,
                            closeOnEscape: false,
                            appendTo: "#wrapper",
                            dialogClass: "link-dialog",
                            width: 725
                        });

                        //window.location="/#home";
                    }
                    catch (e) {
                        App.notification(e);
                    }
                } else {
                    try {
                        App.notification(JSON.parse(oReq.responseText).error);
                    } catch (e) {
                        App.notification();
                    }
                }
            };

            oReq.send(oData);
        },

        showEdit: function () {
            this.$el.find("form.disableEdit").removeClass("disableEdit");
            this.$el.find("input[type='text']").removeAttr("disabled");
            this.$el.find("textarea").removeAttr("disabled");
            this.$el.find(".editContent").hide();
            this.$el.find(".survey:not(.new).videoElement").hide();
            $("#sortable").sortable("enable");
        },

        remove: function () {
            var self = this;
            var sure = confirm("Are you sure?");
            if (!sure) {
                return;
            }
            $.ajax({
                type: "delete",
                url: "/content",
                contentType: "application/json",
                success: function (data) {
                    App.sessionData.set({
                        contentId: null
                    });
                    Backbone.history.navigate("#/upload", {trigger: true});

                },
                error: function (model, xhr) {
                    console.log(xhr);
                    console.log(model);
                }
            });
        },

        decline: function (e) {
            e.preventDefault();
            Backbone.history.navigate("#/home", {trigger: true});
        },

        changeInput: function (e) {
            if ($(e.target).val()) {
                $(e.target).parents(".uploadContainer").find(".right").addClass("active");
            } else {
                $(e.target).parents(".uploadContainer").find(".right").removeClass("active");
            }
        },

        removeQuestion: function (e) {
            var self = this;
            var countQuestion = this.$el.find('.survey').length - 2;
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
            var id = current.data("id");
            if (id !== 'new') {
                this.removedQuestions.push(id);
            }
            $(this.$el).find(".removedQuestions").val(this.removedQuestions.join(" "));
            current.remove();
            self.defineOrder();
        },

        openQuestion: function (e) {
            this.$el.find(".collapseQuestions").css('min-height',this.$el.find(".collapseQuestions").height());
            $('#sortable').sortable('disable');
            this.$el.find(".survey.new").slideUp().remove();

            this.$el.find(".survey .collapseQuestion").show()//.removeClass('hidden');
            this.$el.find(".videoElement").slideUp();

            $(e.target).closest(".survey").find('.collapseQuestion').hide()//.addClass('hidden');
            $(e.target).closest(".survey").find('.videoElement').slideDown();

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
            if (!videoName && !($(e.target).closest(".videoElement").find(".right .uploadContainer .left input[type='text']").val())) {
                $(e.target).closest(".videoElement").find(".right .uploadContainer").addClass("error");
                hasError = !0;
            }
            if (!hasError) {
                var countQuestion = this.$el.find(".survey").length;
                $(e.target).closest(".question").text("SAVE");
                $(e.target).closest(".survey").addClass('canSort').removeClass("new");
                $(e.target).closest(".survey").find('.collapseQuestion h2').text($(e.target).closest(".videoElement").find(".questionText").val());
                if (videoName) {
                    $(e.target).closest(".survey").find('.collapseQuestion .relatedVideo').html("Related video: <b>" + videoName + "</b>");
                }
                if (pdfName) {
                    $(e.target).closest(".survey").find('.collapseQuestion .relatedPdf').html("Related PDF: <b>" + pdfName + "</b>");
                }
                $(e.target).closest(".survey").find(".collapseQuestion").slideDown().removeClass("hidden");
                $(e.target).closest(".videoElement").slideUp();

                this.$el.find(".collapseQuestions").append(_.template(NewSurveyElement)({index: countQuestion + 1}));//.hide().slideDown();
                this.$el.find(".countQuestion").val(countQuestion);
                self.defineOrder();
            }
            $('#sortable').sortable('enable');
        },


        browse: function (e) {
            if (!$(e.target).closest(".disableEdit").length) {
                $(e.target).closest(".uploadContainer").find("input[type='file']").click();
            }
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

        render: function (data) {
            var self = this;
            this.$el.html(_.template(EditTemplate)({
                content: data.content,
                url: data.url,
                count: data.content.survey.length + 1
            }));

            var countQuestion = data.content.survey.length;
            $(this.$el).find(".countQuestion").val(countQuestion);
            _.each(data.content.survey.reverse(), function (item, index) {
                var pdf = _.map(item.pdfUri, function (item) {
                    return item.split("/").pop();
                });
                pdf = pdf.join(" ");
                var arr = item.videoUri.split("/");
                i = arr[arr.length - 1].split('').pop();
                $(self.$el).find(".collapseQuestions").prepend(_.template(SurveyElement)({
                    surveyId: item._id,
                    question: item.question,
                    video: decodeURIComponent(item.videoUri.split("/").pop()),
                    pdf: decodeURIComponent(pdf),
                    index: item.order
                }));

                $("#sortable").sortable({
                    cursor: "move",
                    items: "> div.canSort",
                    opacity: 0.8,
                    revert: true,
                    scroll: false,
                    containment: '.login',
                    placeholder: 'sortable-placeholder',
                    disabled: true,
                    beforeStop: function (e, ui) {
                        self.defineOrder();
                    }
                });
            });

            this.drawImage(data.content.logoUri);
            //this.showEdit();
            this.defineOrder();
            return this;
        },

        defineOrder: function () {
            var self = this;
            self.surveyOrder = [];
            this.$el.find('.collapseQuestions .survey').each(function (i) {
                var index = i + 1;
                if ($(this).hasClass('canSort')) {
                    self.surveyOrder.push($(this).attr("data-id"));
                }

                $(this).find(".videoElement .questionText").attr("name", "question" + index);
                $(this).find(".videoElement .right .uploadContainer.file input[type='file']").attr("name", "video" + index);
                $(this).find(".videoElement .right .uploadContainer.link input").attr("name", "video" + index);
                $(this).find(".videoElement .left .uploadContainer.file input[type='file']").attr("name", "file" + index);
            });
            this.$el.find('.surveyOrder').val(self.surveyOrder.join(' '));
            console.log(self.surveyOrder.join(' '));
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
