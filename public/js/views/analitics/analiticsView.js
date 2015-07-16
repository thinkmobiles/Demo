define([
    'text!templates/analitics/analiticsTemplate.html',
	'text!templates/analitics/questionTemplate.html',
	'text!templates/analitics/prospectTemplate.html',
	"collections/documentAnalyticCollection",
	"collections/questionAnalyticCollection",
	"collections/videoAnalyticCollection",
	"collections/visitAnalyticCollection",
	"collections/contactTrackCollection",
	"models/domainModel",
	'custom',
	'd3',
	'moment'
], function (AnaliticsTemplate, QuestionTemplate, ProspectTemplate, DocumentAnalyticCollection, QuestionAnalyticCollection, VideoAnalyticCollection, VisitAnalyticCollection, ContactTrackCollection, DomainModel, Custom, d3, moment) {

    var View;

    View = Backbone.View.extend({
        className: "mainPage",
		el:"#wrapper",
        events: {
			"change #startDate, #endDate":"updateDate",
			"change #domain":"updateProspect"
			
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
			console.log(this.videoAnalyticCollection.toJSON());
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
			console.log(this.contactTrackCollection);
			this.$el.find("#prospectTable").html(_.template(ProspectTemplate)({prospects:this.contactTrackCollection.toJSON()}));
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


			var data = [{
				'count': 1,
				'newCount':2,
				'total':3,
				'date': '01/01/2015'
			},{
				'count': 1,
				'newCount':3,
				'total':4,
				
				'date': '02/01/2015'
			},{
				'count': 6,
				'newCount':4,
				'total':10,
				'date': '03/01/2015'
			},{
				'count': 7,
				'newCount':23,
				'total':30,
				'date': '04/01/2015'
			},{
				'count': 15,
				'newCount':1,
				'total':16,
				'date': '05/01/2015'
			},{
				'count': 4,
				'newCount':2,
				'total':6,
				'date': '06/01/2015'
			},{
				'count': 16,
				'newCount':6,
				'total':22,
				'date': '07/01/2015'
			}
					   ];



			
			
            return this;
        }


    });
    return View;
});
