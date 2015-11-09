define(["moment"],function (moment) {

	var routes = {
		needAuthorize: [
			'users',
            'upload',
            'edit',
            'main'
        ],

        redirectWhenAuthorize: [
            'registration'
        ],
	};

	routes.allRoutes = routes.needAuthorize.concat(routes.redirectWhenAuthorize);


	var navigateToLastUrl = function(){
		var url; // the url on boot up
        url =  Backbone.history.fragment || Backbone.history.getFragment();

        if ((url === "")) url = 'home';
        if (Backbone.history.fragment) {
            Backbone.history.fragment = '';
        }
		if (routes.allRoutes.indexOf(url)!==-1)return;
		url = "#/"+url;
		return  Backbone.history.navigate(url, {trigger: true});
	}
	
	
	
    var runApplication = function (err, data) {
        var url; // the url on boot up
        url =  Backbone.history.fragment || Backbone.history.getFragment();

        if ((url === "")) url = '#/home';
        if (Backbone.history.fragment) {
            Backbone.history.fragment = '';
        }
		if (url[0]!=="#"){
			url = "#/"+url;
		}
        // check authorize and open current page
        if (!err) {
            App.sessionData.set({
                authorized: true,
                user: data,
				admin:data.isAdmin
            });
			
        } else {
            App.sessionData.set({
                authorized: false,
                user: null
            });
        }
		
        return Backbone.history.navigate(url, {trigger: true});

    };

	var toUrl = function(url, videoId, userId){
		if (videoId&&userId){
			Backbone.history.navigate("#/"+url+"/"+videoId+"/"+userId, {trigger: true});
		}else{
			Backbone.history.navigate("#/"+url, {trigger: true});
		}
	};

	var drawSitesVisits = function(data, el){
		var margin = {top: 20, right: 20, bottom: 30, left: 50},
			width = 820 - margin.left - margin.right,
			height = 300 - margin.top - margin.bottom;

		var parseDate = d3.time.format("%d/%m/%Y").parse;

		//var x = d3.time.scale().range([0, width]);
		var x = d3.scale.ordinal().rangeRoundBands([0, width], 0.1);
		var y = d3.scale.linear()
			.range([height, 0]);

		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.tickFormat(function(d){return  moment(d).format("MMM DD")});
		
		var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left")
			.tickFormat(d3.format("d"));

		var line = d3.svg.line()
			.x(function(d) { return x(d.date) + x.rangeBand() / 2; })
			.y(function(d) { return y(d.old); });
		var lineNew = d3.svg.line()
			.x(function(d) { return x(d.date) + x.rangeBand() / 2; })
			.y(function(d) { return y(d.new); });
		var lineTotal = d3.svg.line()
			.x(function(d) { return x(d.date) + x.rangeBand() / 2; })
			.y(function(d) { return y(d.total); });
		var area = d3.svg.area()
			.x(function(d) { return x(d.date) + x.rangeBand() / 2; })
			.y0(height)
			.y1(function(d) { return y(d.total); });
		d3.select(el).selectAll("*").remove();
		var svg = d3.select(el)
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		data.forEach(function(d) {
			d.date = new Date(d.date);
		});
		
		var div = d3.select(".tooltip");
		
		x.domain(data.map(function (d) {
			return d.date;
		}));
		y.domain([0,  d3.max(data, function(d){ return Math.max(d.total); })]);

		
		svg.append("path")
			.datum(data)
			.attr("class", "area")
			.attr("d", area);
		
		
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);

		svg.append("g")
			.attr("class", "y axis")
			.call(yAxis)


		svg.append("path")
			.datum(data)
			.attr("class", "line")
			.attr("d", line);
		
		svg.append("path")
			.datum(data)
			.attr("class", "lineNew")
			.attr("d", lineNew);
		
		svg.append("path")
			.datum(data)
			.attr("class", "lineTotal")
			.attr("d", lineTotal);

		var showTooltip = function(name){
			return function(d) {
				div.transition()        
					.duration(200)      
					.style("opacity", .9);
				div .html("<span>"+d[name]+"</span>" + "<br/>views" )  
					.style("left", ($(this).closest("svg").offset().left+x(d.date)+x.rangeBand()/2+17)+"px")     
					.style("top", ($(this).closest("svg").offset().top+ y(d[name])- 38) + "px");
				setTimeout( function() {
					$(".tooltip").addClass("show");
				}, 25 );
            }
		}

		var hideTooltip = function() {       
				div.transition()        
					.duration(500)      
					.style("opacity", 0);
			$(".tooltip").removeClass("show");
			}
		
		svg.selectAll(".circle").data(data).enter().append("circle").attr("class", "circle").attr("cx", function (d) {
            return x(d.date) + x.rangeBand() / 2;
        }).attr("cy", function (d) {
            return y(d.old);
        }).attr("r", function () {
            return 4;
        }).style("fill", "#f56a3f").style("stroke-width", "2")
			.on("mouseover",showTooltip("old"))                  
			.on("mouseout", hideTooltip);

		svg.selectAll(".circle1").data(data).enter().append("circle").attr("class", "circle1").attr("cx", function (d) {
            return x(d.date) + x.rangeBand() / 2;
        }).attr("cy", function (d) {
            return y(d.new);
        }).attr("r", function () {
            return 4;
        }).style("fill", "#00c982").style("stroke-width", "2")
			.on("mouseover", showTooltip("new"))                  
			.on("mouseout", hideTooltip);


		svg.selectAll(".circle2").data(data).enter().append("circle").attr("class", "circle2").attr("cx", function (d) {
			return x(d.date) + x.rangeBand() / 2;
		}).attr("cy", function (d) {
			return y(d.total);
		}).attr("r", function () {
			return 4;
		}).style("fill", "#42b9f5").style("stroke-width", "2")
			.on("mouseover",  showTooltip("total"))                  
			.on("mouseout", hideTooltip);
		
	}
	
	var drawBarChart = function(barData, el,isViews){
		d3.select(el).selectAll("*").remove();
		var vis = d3.select(el),
			WIDTH = 820,
			HEIGHT =600,
			MARGINS = {
				top: 20,
				right: 20,
				bottom: 300,
				left: 50
			},
			
			xRange = d3.scale
			.ordinal()
			.rangeRoundBands([MARGINS.left, WIDTH - MARGINS.right], 0.1)
			.domain(barData.map(function (d) {
				return d.name;
			})),
			

			yRange = d3.scale.linear()
			.range([HEIGHT - MARGINS.bottom, MARGINS.top])
			.domain([0,
					 d3.max(barData, function (d) {
						 return d.count;
					 })
					]),

			xAxis = d3.svg.axis()
			.scale(xRange)
			.tickSize(5)
			.tickSubdivide(true)
			.tickFormat(function(d){return  decodeURIComponent(d.split("/").pop())}),

			yAxis = d3.svg.axis()
			.scale(yRange)
			.tickSize(5)
			.orient("left")
			.tickSubdivide(true)
			.tickFormat(d3.format("d"));
		
		var div = d3.select(".tooltip");

		
		vis.append('svg:g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
			.call(xAxis);

		vis.append('svg:g')
			.attr('class', 'y axis')
			.attr('transform', 'translate(' + (MARGINS.left) + ',0)')
			.call(yAxis);


		var colors = d3.scale.category20()
		
		vis.selectAll('rect')
			.data(barData)
			.enter()
			.append('rect')
			.attr('x', function (d) {
				return xRange(d.name);
			})
			.attr('y', function (d) {
				return yRange(d.count);
			})
			.attr('width', xRange.rangeBand())
			.attr('height', function (d) {
				return ((HEIGHT - MARGINS.bottom) - yRange(d.count));
			})
			.attr("fill",function(d,i){return colors(i)})
			.on("mouseover", function(d) {
				div.transition()        
					.duration(200)      
					.style("opacity", .9);
				if (isViews){
					div .html("<span>"+d.count+"</span>" + "<br/>views" )  
						.style("left", ($(this).closest("svg").offset().left+xRange(d.name)+xRange.rangeBand()/2-32)+"px")     
						.style("top", ($(this).closest("svg").offset().top+ yRange(d.count)- 55) + "px");
				}else{
					div .html("<span>"+d.count+"</span>" + "<br/>downloads" )  
						.style("left", ($(this).closest("svg").offset().left+xRange(d.name)+xRange.rangeBand()/2-32)+"px")     
						.style("top", ($(this).closest("svg").offset().top+ yRange(d.count)- 55) + "px");
					
				}
				setTimeout( function() {
					$(".tooltip").addClass("show");
				}, 100 );
            })                  
			.on("mouseout", function(d) {       
				div.transition()        
					.duration(500)      
					.style("opacity", 0);
				setTimeout( function() {
					$(".tooltip").removeClass("show");
				}, 25 );
			});
		/*.on('mouseover',function(d){
		  d3.select(this)
		  .attr('fill','blue');
		  })
		  .on('mouseout',function(d, i){
		  d3.select(this)
		  .attr('fill',colors(i));
		  });*/
	};
	

	var defaultImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANcAAADXCAYAAACJfcS1AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2VpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpERDAxMzM0NDM1MDVFNTExODhBOEVCMjJDQzlBMTUzRiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo3NUVGODIwQjE1QUYxMUU1QjgwMEFBRjU2MEZCOEQ5OCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo3NUVGODIwQTE1QUYxMUU1QjgwMEFBRjU2MEZCOEQ5OCIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6Mzg5QkUwRDRDQTE0RTUxMUEyNEFEMDMzRjZFNDlGNDgiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6REQwMTMzNDQzNTA1RTUxMTg4QThFQjIyQ0M5QTE1M0YiLz4gPC9yZGY6RGVzY3JpcHRp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";

	var drawQuestionsPie = function(questions){
		var w = 164,                        //width
			h = 200,                            //height
			r = 82,                            //radius
			color =[
				"#f4fbfe","#44cbff","#00c982"
			];     //builtin range of colors

		
		for (var i=0;i<questions.length;i++){
			var sum = questions[i].not+questions[i].some+questions[i].very;
			var data = [{"label":"not", "value":questions[i].not}, 
						{"label":"some", "value":questions[i].some}, 
						{"label":"very", "value":questions[i].very}];
			var vis = d3.select("#question"+i)
				.data([data])                   //associate our data with the document
				.attr("width", w)           //set the width and height of our visualization (these will be attributes of the <svg> tag
				.attr("height", h)
				.append("svg:g")                //make a group to hold our pie chart
				.attr("transform", "translate(" + r + "," + r + ")")    //move the center of the pie chart from 0, 0 to radius, radius

			var arc = d3.svg.arc()              //this will create <path> elements for us using arc data
				.outerRadius(r);

			var pie = d3.layout.pie()           //this will create arc data for us given a list of values
				.value(function(d) { return d.value; });    //we must tell it out to access the value of each element in our data array

			var arcs = vis.selectAll("g.slice")     //this selects all <g> elements with class slice (there aren't any yet)
				.data(pie)                          //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties) 
				.enter()                            //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
				.append("svg:g")                //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
				.attr("class", "slice");

			


			arcs.append("svg:path")
				.attr("fill", function(d, i) { return color[i]; } ) //set the color for each slice to be chosen from the color function defined above
				.attr("d", arc)
			
			//this creates the actual SVG path using the associated data (pie) with the arc drawing function

			arcs.append("svg:text")                                     //add a label to each slice
				.attr("transform", function(d) {                    //set the label's origin to the center of the arc
					//we have to make sure to set these before calling arc.centroid
					d.innerRadius = 0;
					d.outerRadius = r;
				    var c = arc.centroid(d);
					return "translate(" + c[0]*1.4 +"," + c[1]*1.4 + ")";      //this gives us a pair of coordinates like [50, 50]
				})
				.attr("text-anchor", "middle")                          //center the text on it's origin
				.text(function(d, i) { return (data[i].value/sum*100).toFixed(0)+"%"; })
				.attr("fill", function(d, i) { return  (!data[i].value ?"transparent":(data[i].label!=="not"?"white":"black"))});     
			
			arcs.append("circle")
				.attr("cx","0")
				.attr("cy","0")
				.attr("r","35")
				.attr("fill","white")
			arcs.append("text")
				.attr("text-anchor","middle")
				.attr("fill","black")
				.text(sum)
				.attr("transform", function(d) {
					return "translate(0,-4)";
				})
				.style("font-size","20px")
			arcs.append("text")
				.attr("text-anchor","middle")
				.attr("fill","silver")
				.text("(100%)")
				.attr("transform", function(d) {
					return "translate(0,13)";
				})
				.style("font-size","13px")
		}
		
	};

	
    return {
        runApplication: runApplication,
		defaultImage: defaultImage,
		drawBarChart:drawBarChart,
		drawSitesVisits:drawSitesVisits,
		drawQuestionsPie:drawQuestionsPie,
		routes:routes,
		toUrl:toUrl,
		navigateToLastUrl:navigateToLastUrl
    };
});
