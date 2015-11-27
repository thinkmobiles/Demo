define([
    'text!templates/analytics/analyticsTemplate.html',
    'text!templates/analytics/questionTemplate.html',
    'text!templates/analytics/prospectTemplate.html',
    'text!templates/analytics/prospectActivityTemplate.html',
    'text!templates/analytics/contactMeTemplate.html',
    "collections/campaignsCollection",
    "collections/documentAnalyticCollection",
    "collections/questionAnalyticCollection",
    "collections/videoAnalyticCollection",
    "collections/visitAnalyticCollection",
    "collections/contactTrackCollection",
    "collections/contactMeCollection",
    "models/prospectActivityModel",
    "models/domainModel",
    'custom',
    'd3',
    'moment'
], function (AnaliticsTemplate, QuestionTemplate, ProspectTemplate, ProspectActivityTemplate, ContactMeTemplate, CampaignsCollection, DocumentAnalyticCollection, QuestionAnalyticCollection, VideoAnalyticCollection, VisitAnalyticCollection, ContactTrackCollection, ContactMeCollection, ProspectActivityModel, DomainModel, Custom, d3, moment) {

    var View;

    View = Backbone.View.extend({
        className: "mainPage",
        el: "#wrapper",
        events: {
            "change #startDate input, #endDate input": "updateDate",
            "click #prospectTable table tr": "showContactInfo",
            "click .customSelect ul li": "updateProspect",
            "click .legend ul li.print:not(.all) span": "print",
            "click .legend ul li.print.all ": "printContacts",
            "click .campaigns ul li": "renderAnalytic",
            "click .campaigns .customSelect": "toggleCampaigns",
            "click .customSelect .showList": "showList",
            "click .contactMe tr": "showMessage",
            "click #startDate, #endDate": "showDatepicker"
        },


        initialize: function () {
            var self = this;

            this.campaignsCollection = new CampaignsCollection();
            this.campaignsCollection.bind('reset', self.render, self);
        },

        toggleCampaigns: function (e) {
            $(e.target).closest('.campaigns').find('.campaign-container').slideToggle();
        },

        print: function (e) {
            var el;

            el = $(e.target).closest("div.printPart");
            window.frames["print_frame"].document.body.innerHTML = '<style>' + document.getElementById('less:less-style').innerHTML + '</style>' + '<div class="container analitics">' + el.html() + '</div>';
            window.frames["print_frame"].document.getElementsByClassName("print")[0].style.display = "none";
            window.frames["print_frame"].window.focus();
            window.frames["print_frame"].window.print();
        },

        printContacts: function () {
            var domain;

            domain = this.$el.find(".customSelect .current").text();
            if (!domain) {
                App.notification('You must choose some domain');
                return;
            }

            $.ajax({
                type: "GET",
                url: "analytic/contacts",
                data: {
                    domain: domain
                },
                contentType: "application/json",
                success: function (data) {
                    if (!data) {
                        return alert('You must choose some domain')
                    }
                    var html = '';
                    _.each(data, function (elem) {
                        html += _.template(ProspectActivityTemplate)(elem);
                    });

                    window.frames["print_frame"].document.body.innerHTML = '<style>' + document.getElementById('less:less-style').innerHTML + '</style>' + '<div class="container analitics"><div id="prospectActivity">' + html + '</div></div>';
                    window.frames["print_frame"].window.focus();
                    window.frames["print_frame"].window.print();
                },
                error: function (model, xhr) {
                    console.log(model);
                    console.log(xhr);
                    App.notification('Some trouble happens');
                }
            });


        },

        showDatepicker: function (e) {
            $(e.target).closest("div").find("input").datepicker('show');
        },


        updateDate: function () {
            this.documentAnalyticCollection.update({
                from: $("#startDate input").val(),
                to: $("#endDate input").val()
            });
            this.questionAnalyticCollection.update({
                from: $("#startDate input").val(),
                to: $("#endDate input").val()
            });
            this.videoAnalyticCollection.update({
                from: $("#startDate input").val(),
                to: $("#endDate input").val()
            });
            this.visitAnalyticCollection.update({
                from: $("#startDate input").val(),
                to: $("#endDate input").val()
            });
        },


        showContactInfo: function (e) {
            var name;
            var email;

            $(e.target).closest("table").find("tr.current").removeClass("current");
            $(e.target).closest("tr").addClass("current");
            email = $(e.target).closest("tr").data("email");
            this.prospectActivityModel.update({email: email});
            name = this.$el.find(".current .prospectName").text();
            this.$el.find(".survayName").text(name);
        },

        showProspectActivity: function (e) {
            var activity;
            var name;

            activity = this.prospectActivityModel.toJSON();
            activity.videos = _.map(activity.videos, function (video) {
                var sec = video.time % 60;
                if (sec < 10) {
                    sec = "0" + sec;
                }
                video.time = Math.floor(video.time / 60) + ":" + sec;
                return video
            });
            this.$el.find("#prospectActivity").html(_.template(ProspectActivityTemplate)(this.prospectActivityModel.toJSON()));
            name = this.$el.find(".current .prospectName").text();
            this.$el.find(".survayName").text(activity.name || name);
        },

        updateProspect: function (e) {
            var current;
            var self = this;

            current = $(e.target).text();
            this.$el.find(".customSelect .current").text(current);
            this.$el.find(".customSelect ul").hide();
            this.contactTrackCollection.update({id: self.campaignId, domain: current});
        },

        showList: function (e) {
            e.stopPropagation();
            this.$el.find(".customSelect ul").show();
        },

        showMessage: function (e) {
            var index;

            index = $(e.target).closest("table").find("tr").index($(e.target).closest("tr"));
            if (index) {
                $(e.target).closest("table").find(".current").removeClass("current");
                $(e.target).closest("tr").addClass("current");
                this.$el.find(".textMessage").text(this.contactMeCollection.toJSON()[index - 1].message);
            }
        },

        renderDocumentChart: function () {
            var result;

            result = this.documentAnalyticCollection.toJSON()[0];
            if (!result || !result.docs || !result.docs.length) {
                this.$el.find(".info .countDownload").text('0');
                this.$el.find('#docDownload').hide();
                return;
            }
            this.$el.find('#docDownload').show();
            this.$el.find(".info .countDownload").text(result.download);
            Custom.drawBarChart(result.docs, '#docDownload');
        },

        renderVisitChart: function () {
            Custom.drawSitesVisits(this.visitAnalyticCollection.toJSON(), '#siteVisits');
        },

        renderVideoChart: function () {
            var data;
            var mas;

            data = this.videoAnalyticCollection.toJSON()[0];
            mas = data.survey;
            data.mainVideo.name = "Main Video";
            mas.unshift(data.mainVideo);
            Custom.drawBarChart(mas, '#videoView', true);
            this.$el.find(".info .watchedEnd").text(data.watchedEnd);
            this.$el.find(".info .watchedSurvey").text(data.watchedSurvey);
            this.$el.find(".info .allVideo").text(data.all);

        },

        renderContactMe: function () {
            var contactMe;

            contactMe = this.contactMeCollection.toJSON();
            contactMe = _.map(contactMe, function (item) {
                item.sentAt = moment(item.sentAt).format("DD MMMM YYYY");
                item.fullMessage = item.message;
                item.message = item.message.length > 25 ? (item.message.substring(0, 24) + "...") : item.message;
                return item;
            });
            this.$el.find("#contactMe").html(_.template(ContactMeTemplate)({contactList: contactMe}));
        },

        renderDomainList: function () {
            var self = this;
            var domains;
            var s = "";

            if (!this.domainModel) {
                return;
            }

            domains = this.domainModel.toJSON();
            if (!domains || Object.keys(domains).length) {
                this.$el.find(".haveActivity").show();
                this.$el.find(".noActivity").hide();
            }

            for (var i in domains) {
                if(i!=='id'){

                    s += "<li>" + domains[i] + "</li>";
                }
            }

            this.contactTrackCollection = new ContactTrackCollection({id: self.camaignId, domain: domains[0]});
            this.contactTrackCollection.bind('reset', self.renderContactTable, self);
            this.$el.find(".customSelect ul").html(s);
            this.$el.find(".customSelect .current").text(domains[0]);
        },

        renderContactTable: function () {
            var self = this;
            var prospects = this.contactTrackCollection.toJSON();
            this.$el.find("#prospectTable").html(_.template(ProspectTemplate)({prospects: prospects}));
            this.$el.find("#prospectTable tr").eq(1).addClass("current");
            this.prospectActivityModel = new ProspectActivityModel({email: prospects[0].email});
            this.prospectActivityModel.bind('change', self.showProspectActivity, self);
        },

        renderQuestionChart: function () {
            this.$el.find(".questionsPie").html(_.template(QuestionTemplate)({questions: this.questionAnalyticCollection.toJSON()}));
            Custom.drawQuestionsPie(this.questionAnalyticCollection.toJSON());
        },

        renderAnalytic: function (e) {
            var self = this;
            self.campaignId = $(e.target).attr("data-id");

            this.$el.find('.nameOfCampaign').text($(e.target).text().toUpperCase() + " STATISTIC");
            $(e.target).closest('ul').find('.current').removeClass('current');
            $(e.target).addClass('current');

            this.documentAnalyticCollection.update({
                id: self.campaignId,
                from: moment().subtract(7, 'days').format("MM/DD/YYYY"),
                to: moment().format("MM/DD/YYYY")
            });
            this.questionAnalyticCollection.update({
                id: self.campaignId,
                from: moment().subtract(7, 'days').format("MM/DD/YYYY"),
                to: moment().format("MM/DD/YYYY")
            });
            this.videoAnalyticCollection.update({
                id: self.campaignId,
                from: moment().subtract(7, 'days').format("MM/DD/YYYY"),
                to: moment().format("MM/DD/YYYY")
            });
            this.visitAnalyticCollection.update({
                id: self.campaignId,
                from: moment().subtract(7, 'days').format("MM/DD/YYYY"),
                to: moment().format("MM/DD/YYYY")
            });
            this.contactMeCollection.update({
                id: self.campaignId,
                from: moment().subtract(7, 'days').format("MM/DD/YYYY"),
                to: moment().format("MM/DD/YYYY")
            });
            this.domainModel.update({id: self.campaignId});
        },

        render: function () {
            var self = this;
            var model = this.campaignsCollection.first();


            this.$el.html(_.template(AnaliticsTemplate)({data: self.campaignsCollection.toJSON()}));

            $("#startDate input").datepicker({
                onSelect: function (selected) {
                    $("#endDate input").datepicker("option", "minDate", selected);
                    self.updateDate();
                },
                maxDate: new Date()
            });

            $("#startDate input").datepicker('setDate', moment().subtract(7, 'days')._d);

            $("#endDate input").datepicker({
                onSelect: function (selected) {
                    $("#startDate input").datepicker("option", "maxDate", selected);
                    self.updateDate();
                },
                minDate: moment().subtract(7, 'days')._d
            });

            $("#endDate input").datepicker('setDate', new Date());

            if (model) {
                this.campaignId = model.id;
                this.documentAnalyticCollection = new DocumentAnalyticCollection({
                    id: self.campaignId,
                    from: moment().subtract(7, 'days').format("MM/DD/YYYY"),
                    to: moment().format("MM/DD/YYYY")
                });
                this.questionAnalyticCollection = new QuestionAnalyticCollection({
                    id: self.campaignId,
                    from: moment().subtract(7, 'days').format("MM/DD/YYYY"),
                    to: moment().format("MM/DD/YYYY")
                });
                this.videoAnalyticCollection = new VideoAnalyticCollection({
                    id: self.campaignId,
                    from: moment().subtract(7, 'days').format("MM/DD/YYYY"),
                    to: moment().format("MM/DD/YYYY")
                });
                this.visitAnalyticCollection = new VisitAnalyticCollection({
                    id: self.campaignId,
                    from: moment().subtract(7, 'days').format("MM/DD/YYYY"),
                    to: moment().format("MM/DD/YYYY")
                });
                this.contactMeCollection = new ContactMeCollection({
                    id: self.campaignId,
                    from: moment().subtract(7, 'days').format("MM/DD/YYYY"),
                    to: moment().format("MM/DD/YYYY")
                });

                this.domainModel = new DomainModel({id: self.campaignId});

                this.documentAnalyticCollection.bind('reset', self.renderDocumentChart, self);
                this.questionAnalyticCollection.bind('reset', self.renderQuestionChart, self);
                this.videoAnalyticCollection.bind('reset', self.renderVideoChart, self);
                this.visitAnalyticCollection.bind('reset', self.renderVisitChart, self);
                this.contactMeCollection.bind('reset', self.renderContactMe, self);
                this.domainModel.bind('change', self.renderDomainList, self);
            }

            return this;
        }
    });
    return View;
});
