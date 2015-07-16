define([
    'text!templates/analitics/analiticsTemplate.html',
	'text!templates/analitics/questionTemplate.html',
	"collections/documentAnalyticCollection",
	"collections/questionAnalyticCollection",
	"collections/videoAnalyticCollection",
	'custom',
	'd3',
	'moment'
], function (AnaliticsTemplate, QuestionTemplate, DocumentAnalyticCollection, QuestionAnalyticCollection, VideoAnalyticCollection, Custom, d3, moment) {

    var View;

    View = Backbone.View.extend({
        className: "mainPage",
		el:"#wrapper",
        events: {
			"change #startDate, #endDate":"updateDate"
			
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
			this.documentAnalyticCollection.bind('reset', self.renderDocumentChart, self);
			this.questionAnalyticCollection.bind('reset', self.renderQuestionChart, self);
			this.videoAnalyticCollection.bind('reset', self.renderVideoChart, self);
			
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
		},

		renderDocumentChart: function(){
			Custom.drawBarChart(this.documentAnalyticCollection.toJSON(), '#docDownload');
		},
		
		renderVideoChart: function(){
			console.log(this.videoAnalyticCollection.toJSON());
			var mas = this.videoAnalyticCollection.toJSON()[0].survey;
			this.videoAnalyticCollection.toJSON()[0].mainVideo.name="Main Video";
			mas.unshift(this.videoAnalyticCollection.toJSON()[0].mainVideo);
			Custom.drawBarChart(mas, '#videoView');
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
			Custom.drawSitesVisits(data, '#siteVisits');



			
			
            return this;
        }


    });
    return View;
});
