define([
    'text!templates/analitics/analiticsTemplate.html',
	'text!templates/analitics/questionTemplate.html',
	'text!templates/analitics/prospectTemplate.html',
	'text!templates/analitics/prospectActivityTemplate.html',
	'text!templates/analitics/contactMeTemplate.html',
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
], function (AnaliticsTemplate, QuestionTemplate, ProspectTemplate, ProspectActivityTemplate, ContactMeTemplate,  DocumentAnalyticCollection, QuestionAnalyticCollection, VideoAnalyticCollection, VisitAnalyticCollection, ContactTrackCollection, ContactMeCollection, ProspectActivityModel, DomainModel, Custom, d3, moment) {

    var View;

    View = Backbone.View.extend({
        className: "mainPage",
		el:"#wrapper",
        events: {
			"change #startDate, #endDate":"updateDate",
			"click #prospectTable table tr": "showContactInfo",
			"click .customSelect ul li": "updateProspect",
			"click .customSelect .current": "showList"
			
        },


        initialize: function () {
			var self = this;
			this.documentAnalyticCollection = new DocumentAnalyticCollection({
				from:moment().subtract(7, 'days').format("MM/DD/YYYY"),
				to:moment().format("MM/DD/YYYY")
			});
			this.questionAnalyticCollection = new QuestionAnalyticCollection({
				from:moment().subtract(7, 'days').format("MM/DD/YYYY"),
				to:moment().format("MM/DD/YYYY")
			});
			this.videoAnalyticCollection = new VideoAnalyticCollection({
				from:moment().subtract(7, 'days').format("MM/DD/YYYY"),
				to:moment().format("MM/DD/YYYY")
			});
			this.visitAnalyticCollection = new VisitAnalyticCollection({
				from:moment().subtract(7, 'days').format("MM/DD/YYYY"),
				to:moment().format("MM/DD/YYYY")
			});
			this.contactMeCollection = new ContactMeCollection({
				from:moment().subtract(7, 'days').format("MM/DD/YYYY"),
				to:moment().format("MM/DD/YYYY")
			});
			this.domainModel = new DomainModel();
			this.documentAnalyticCollection.bind('reset', self.renderDocumentChart, self);
			this.questionAnalyticCollection.bind('reset', self.renderQuestionChart, self);
			this.videoAnalyticCollection.bind('reset', self.renderVideoChart, self);
			this.visitAnalyticCollection.bind('reset', self.renderVisitChart, self);
			this.contactMeCollection.bind('reset', self.renderContactMe, self);
			this.domainModel.bind('change', self.renderDomainList, self);
			
            this.render();
        },

		updateDate: function(e){
			this.documentAnalyticCollection.update({
				from:$("#startDate").val(),
				to: $("#endDate").val()
			});
			this.questionAnalyticCollection.update({
				from:$("#startDate").val(),
				to: $("#endDate").val()
			});
			this.videoAnalyticCollection.update({
				from:$("#startDate").val(),
				to: $("#endDate").val()
			});
			this.visitAnalyticCollection.update({
				from:$("#startDate").val(),
				to: $("#endDate").val()
			});	
		},


		showContactInfo: function(e){
			var self = this;
			var email = $(e.target).closest("tr").data("email");
			$(e.target).closest("table").find("tr.current").removeClass("current");
			$(e.target).closest("tr").addClass("current");
			this.prospectActivityModel.update({email:email});
		},

		showProspectActivity: function(e){
			var activity = this.prospectActivityModel.toJSON();
			activity.videos = _.map(activity.videos,function(video){
				var sec = video.time%60;
				if (sec<10){
					sec = "0"+sec;
				}
				video.time = Math.floor(video.time/60)+":"+sec;
				return video
			});
			this.$el.find("#prospectActivity").html(_.template(ProspectActivityTemplate)(this.prospectActivityModel.toJSON()));
			
		},
		updateProspect: function(e){
			var current = $(e.target).text();
			this.$el.find(".customSelect .current").text(current);
			this.$el.find(".customSelect ul").hide();
			this.contactTrackCollection.update({domain:current});
		},

		showList:function(e){
			e.stopPropagation();
			this.$el.find(".customSelect ul").show();
		},

		renderDocumentChart: function(){
			var result = this.documentAnalyticCollection.toJSON()[0];
			console.log(result);
			Custom.drawBarChart(result.docs, '#docDownload');
		},
		
		renderVisitChart: function(){
			Custom.drawSitesVisits(this.visitAnalyticCollection.toJSON(), '#siteVisits');
		},
		
		renderVideoChart: function(){
			var mas = this.videoAnalyticCollection.toJSON()[0].survey;
			this.videoAnalyticCollection.toJSON()[0].mainVideo.name="Main Video";
			mas.unshift(this.videoAnalyticCollection.toJSON()[0].mainVideo);
			Custom.drawBarChart(mas, '#videoView');
		},

		renderContactMe:function(){
			var contactMe = this.contactMeCollection.toJSON();
			contactMe = _.map(contactMe,function(item){
				item.sentAt = moment(item.sentAt).format("DD MMMM YYYY");
				item.message = item.message.length>25?(item.message.substring(0,24)+"..."):item.message;
				return item;
			});
			this.$el.find("#contactMe").html(_.template(ContactMeTemplate)({contactList:contactMe}));
		},

		renderDomainList: function(){
			var self = this;
			if (!this.domainModel)return;
			var domains = this.domainModel.toJSON();
			var s = "";
			for (var i in domains){
				s+="<li>"+domains[i]+"</li>";
			}
			this.contactTrackCollection = new ContactTrackCollection({domain:domains[0]});
			this.contactTrackCollection.bind('reset', self.renderContactTable, self);
			this.$el.find(".customSelect ul").html(s);
			this.$el.find(".customSelect .current").text(domains[0]);
		},

		renderContactTable:function(){
			var self = this;
			var prospects = this.contactTrackCollection.toJSON();
			this.$el.find("#prospectTable").html(_.template(ProspectTemplate)({prospects:prospects}));
			this.$el.find("#prospectTable tr").eq(1).addClass("current");
			this.prospectActivityModel = new ProspectActivityModel({email:prospects[0].email});
			this.prospectActivityModel.bind('change', self.showProspectActivity, self);
		},
		
		renderQuestionChart: function(){
			this.$el.find(".questionsPie").html(_.template(QuestionTemplate)({questions:this.questionAnalyticCollection.toJSON()}));
			Custom.drawQuestionsPie(this.questionAnalyticCollection.toJSON());
		},
		
        render: function () {
			var self = this;
		
            this.$el.html(_.template(AnaliticsTemplate));
			$("#startDate").datepicker({
				onSelect: function(selected) {
					$("#endDate").datepicker("option","minDate", selected);
					self.updateDate();
				},
				maxDate:  new Date()
			});
			$("#startDate").datepicker('setDate', moment().subtract(7, 'days')._d);
			$("#endDate").datepicker({
				onSelect: function(selected) {
					$("#startDate").datepicker("option","maxDate", selected);
					self.updateDate();
				},
				minDate:moment().subtract(7, 'days')._d
			});
			$("#endDate").datepicker('setDate', new Date());
		
            return this;
        }


    });
    return View;
});
