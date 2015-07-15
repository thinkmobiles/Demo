define([
    'text!templates/analitics/analiticsTemplate.html',
	'custom',
	'd3',
	'moment'
], function (AnaliticsTemplate, Custom, d3, moment) {

    var View;

    View = Backbone.View.extend({
        className: "mainPage",
		el:"#wrapper",
        events: {
        },


        initialize: function () {
            this.render();
        },


        render: function () {
						var questions =[
				{
					name:"question 1",
					"not":80,
					"somewhat":120,
					"very":100
				},
				{
					name:"question 2",
					"not":10,
					"somewhat":140,
					"very":10
				},
				{
					name:"question 3",
					"not":180,
					"somewhat":20,
					"very":60
				}
				
			] 
            this.$el.html(_.template(AnaliticsTemplate)({questions:questions}));


			$("#startDate").datepicker();
			$("#startDate").datepicker('setDate', moment().subtract(7, 'days')._d);
			$("#endDate").datepicker();
			$("#endDate").datepicker('setDate', new Date());
			var barData = [{
				'count': 1,
				'name': 'my.pdf'
			},{
				'count': 5,
				'name': 'my1.pdf'
			},{
				'count': 3,
				'name': 'my2.pdf'
			},{
				'count': 6,
				'name': 'my3.pdf'
			}
						  ];


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




			Custom.drawBarChart(barData, '#docDownload');
			Custom.drawSitesVisits(data, '#siteVisits');
			Custom.drawQuestionsPie(questions);
            return this;
        }


    });
    return View;
});
