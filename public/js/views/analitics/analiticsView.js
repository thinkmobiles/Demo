define([
    'text!templates/analitics/analiticsTemplate.html',
	'text!templates/analitics/questionTemplate.html',
	"collections/documentAnalyticCollection",
	"collections/questionAnalyticCollection",
	'custom',
	'd3',
	'moment'
], function (AnaliticsTemplate, QuestionTemplate, DocumentAnalyticCollection, QuestionAnalyticCollection, Custom, d3, moment) {

    var View;

    View = Backbone.View.extend({
        className: "mainPage",
		el:"#wrapper",
        events: {
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
			this.documentAnalyticCollection.bind('reset', self.renderDocumentChart, self);
			this.questionAnalyticCollection.bind('reset', self.renderQuestionChart, self);
			
            this.render();
        },



		renderDocumentChart: function(){
			Custom.drawBarChart(this.documentAnalyticCollection.toJSON(), '#docDownload');
		},

		renderQuestionChart: function(){
			this.$el.find(".questionsPie").html(_.template(QuestionTemplate)({questions:this.questionAnalyticCollection.toJSON()}));
			Custom.drawQuestionsPie(this.questionAnalyticCollection.toJSON());
		},
		
        render: function () {
						var questions =[
				{
					name:"question 1",
					"not":80,
					"some":120,
					"very":100
				},
				{
					name:"question 2",
					"not":10,
					"some":140,
					"very":10
				},
				{
					name:"question 3",
					"not":180,
					"some":20,
					"very":60
				}
				
			] 
            this.$el.html(_.template(AnaliticsTemplate));


			$("#startDate").datepicker();
			$("#startDate").datepicker('setDate', moment().subtract(7, 'days')._d);
			$("#endDate").datepicker();
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
