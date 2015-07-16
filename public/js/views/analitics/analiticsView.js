define([
    'text!templates/analitics/analiticsTemplate.html',
	'text!templates/analitics/questionTemplate.html',
	'text!templates/analitics/prospectTemplate.html',
	'text!templates/analitics/prospectActivityTemplate.html',
	"collections/documentAnalyticCollection",
	"collections/questionAnalyticCollection",
	"collections/videoAnalyticCollection",
	"collections/visitAnalyticCollection",
	"collections/contactTrackCollection",
	"models/prospectActivityModel",
	"models/domainModel",
	'custom',
	'd3',
	'moment'
], function (AnaliticsTemplate, QuestionTemplate, ProspectTemplate, prospectActivityTemplate, DocumentAnalyticCollection, QuestionAnalyticCollection, VideoAnalyticCollection, VisitAnalyticCollection, ContactTrackCollection, ProspectActivityModel, DomainModel, Custom, d3, moment) {

    var View;

    View = Backbone.View.extend({
        className: "mainPage",
		el:"#wrapper",
        events: {
			"change #startDate, #endDate":"updateDate",
			"change #domain":"updateProspect",
			"click #prospectTable table tr": "showContactInfo"
			
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
			this.domainModel = new DomainModel();
			this.documentAnalyticCollection.bind('reset', self.renderDocumentChart, self);
			this.questionAnalyticCollection.bind('reset', self.renderQuestionChart, self);
			this.videoAnalyticCollection.bind('reset', self.renderVideoChart, self);
			this.visitAnalyticCollection.bind('reset', self.renderVisitChart, self);
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
			this.prospectActivityModel.update({email:email});
		},

		showProspectActivity: function(e){
			this.$el.find("#prospectActivity").html(_.template(prospectActivityTemplate)(this.prospectActivityModel.toJSON()));
			
		},
		updateProspect: function(e){
			this.contactTrackCollection.update({domain:this.$el.find("#domain").find("option:selected").text()});
		},

		renderDocumentChart: function(){
			Custom.drawBarChart(this.documentAnalyticCollection.toJSON(), '#docDownload');
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
		

		renderDomainList: function(){
			var self = this;
			if (!this.domainModel)return;
			var domains = this.domainModel.toJSON();
			var s = "";
			for (var i in domains){
				s+="<option>"+domains[i]+"</option>";
			}
			this.contactTrackCollection = new ContactTrackCollection({domain:domains[0]});
			this.contactTrackCollection.bind('reset', self.renderContactTable, self);
			this.$el.find("#domain").html(s);
		},

		renderContactTable:function(){
			var self = this;
			var prospects = this.contactTrackCollection.toJSON();
			this.$el.find("#prospectTable").html(_.template(ProspectTemplate)({prospects:prospects}));

			this.prospectActivityModel = new ProspectActivityModel({email:prospects[0].email});
			this.prospectActivityModel.bind('change', self.showProspectActivity, self);
		},
		
		renderQuestionChart: function(){
			this.$el.find(".questionsPie").html(_.template(QuestionTemplate)({questions:this.questionAnalyticCollection.toJSON()}));
			Custom.drawQuestionsPie(this.questionAnalyticCollection.toJSON());
		},
		
        render: function () {
			var self = this;

			var contactList = [
				{
					name:"Peter Hickey",
					email:"peter@sdasd.sss",
					date:new Date(),
					message:"This is a message for DemoRocket. Blah blah blah"
				},
				{
					name:"Peter Hickey",
					email:"peter@sdasd.sss",
					date:new Date(),
					message:"This is a message for DemoRocket. Blah blah blah"
				},
				{
					name:"Peter Hickey",
					email:"peter@sdasd.sss",
					date:new Date(),
					message:"This is a message for DemoRocket. Blah blah blah"
				},
				{
					name:"Peter Hickey",
					email:"peter@sdasd.sss",
					date:new Date(),
					message:"This is a message for DemoRocket. Blah blah blah"
				},
				{
					name:"Peter Hickey",
					email:"peter@sdasd.sss",
					date:new Date(),
					message:"This is a message for DemoRocket. Blah blah blah"
				},
				{
					name:"Peter Hickey",
					email:"peter@sdasd.sss",
					date:new Date(),
					message:"This is a message for DemoRocket. Blah blah blah"
				},
				{
					name:"Peter Hickey",
					email:"peter@sdasd.sss",
					date:new Date(),
					message:"This is a message for DemoRocket. Blah blah blah"
				},
				{
					name:"Peter Hickey",
					email:"peter@sdasd.sss",
					date:new Date(),
					message:"This is a message for DemoRocket. Blah blah blah"
				},
			];

			
            this.$el.html(_.template(AnaliticsTemplate)({contactList:contactList}));


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
