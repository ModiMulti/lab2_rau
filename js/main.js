//wrapping everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
var keyArray = ["Electricity consumption in kWh","Carbon dioxide emission in Mt","Electricity from fossil fuels","Electricity from nuclear fuels","Electricity from hydroelectric plants","Electricity from other renewable sources"];
var expressed = keyArray[0];//initial attribute

window.onload = initialize(); //start script once HTML is loaded

function initialize(){ //the first function called once the html is loaded
	setMap();
};

function setMap(){ //set choropleth map parameters	
	//map frame dimensions
	var width = 860;
	var height = 500;
	
	//create a title for the page
	 var title = d3.select("body")
	 	.append("h1")
	 	.text("Electricity Consumption and Carbon Dioxide Emission Per Person in European Union Countries");
	
	//create a new svg element with the above dimensions
	var map = d3.select("body")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("class", "map");
	
	//create Europe albers equal area conic projection, centered on Germany
	var projection = d3.geo.albers()
		.center([-10, 52])
		.rotate([-20, 0])
		.parallels([43, 62])
		.scale(800)
		.translate([width / 2, height / 2]);
	
	//create svg path generator using the projection
	var path = d3.geo.path()
		.projection(projection);

	//create graticule generator
    var graticule = d3.geo.graticule()
		.step([30, 30]); //place graticule lines every 30 degrees of longitude and latitude
	
	//create graticule background
	var gratBackground = map.append("path")
		.datum(graticule.outline) //bind graticule background
		.attr("class", "gratBackground") //assign class for styling
		.attr("d", path) //project graticule
	
	//create graticule lines	
	var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
		.data(graticule.lines) //bind graticule lines to each element to be created
	  	.enter() //create an element for each datum
		.append("path") //append each element to the svg as a path element
		.attr("class", "gratLines") //assign class for styling
		.attr("d", path); //project graticule lines

	queue() //use queue.js to parallelize asynchronous data loading for cpu efficiency
		.defer(d3.csv, "data/lab2Data.csv") //load attributes data from csv
		.defer(d3.json, "data/countries.topojson") //load geometry from countries topojson
		.defer(d3.json, "data/euNations.topojson") //load geometry from nations topojson
		.await(callback);

	//create callback to use variables later
    function callback(error, csvData, countriesData, euData){
		
		var recolorMap = colorScale(csvData); //retrieve color scale generator

		//variables for csv to json data transfer
		var jsonRegions = euData.objects.euNations.geometries;
			
		//loop through csv data to assign each csv region's values to json region properties
		for (var i=0; i<csvData.length; i++) {		
			var csvRegion = csvData[i]; //the current region's attributes
			var csvAdm0 = csvRegion.adm0_code; //adm0 code
			
			//loop through json regions to assign csv data to the right region
			for (var a=0; a<jsonRegions.length; a++){
				
				//where adm0 codes match, attach csv data to json object
				if (jsonRegions[a].properties.adm0_code == csvAdm0){
					
					//one more for loop to assign all key/value pairs to json object
					for (var key in keyArray){
						var attr = keyArray[key];
						var val = parseFloat(csvRegion[attr]);
						jsonRegions[a].properties[attr] = val;
					};
					
					jsonRegions[a].properties.name = csvRegion.name; //set prop
					break; //stop looking through the json regions
				};
			};
		};

		//add Europe countries geometry to map			
		var countries = map.append("path") //create SVG path element
			.datum(topojson.feature(countriesData, countriesData.objects.countries)) //bind countries data to path element
			.attr("class", "countries") //assign class for styling countries
			.attr("d", path); //project data as geometry in svg

		//add regions to map as enumeration units colored by data
		var regions = map.selectAll(".regions")
			.data(topojson.feature(euData, euData.objects.euNations).features) //bind regions data to path element
			.enter() //create elements
			.append("path") //append elements to svg
			.attr("class", "regions") //assign class for additional styling
			.attr("id", function(d) { return d.properties.adm0_code })
			.attr("d", path) //project data as geometry in svg
			.style("fill", function(d) { //color enumeration units
				return choropleth(d, recolorMap);
			})
			.on("mouseover", highlight)
			.on("mouseout", dehighlight)
			.on("mousemove", moveLabel)
			.append("desc") //append the current color
				.text(function(d) {
					return choropleth(d, recolorMap);
				});

		createDropdown(csvData); //create the dropdown menu
        
        //add coordinated visualization to the map
        setChart(csvData, colorScale);
        
	};
};

function createDropdown(csvData){
	//add a select element for the dropdown menu
	var dropdown = d3.select("body")
		.append("div")
		.attr("class","dropdown") //for positioning menu with css
		.html("<h3>Select Attribute:</h3>")
		.append("select")
		.on("change", function(){ changeAttribute(this.value, csvData) }); //changes expressed attribute
	
	//create each option element within the dropdown
	dropdown.selectAll("options")
		.data(keyArray)
		.enter()
		.append("option")
		.attr("value", function(d){ return d })
		.text(function(d) {
			d = d[0].toUpperCase() + d.substring(1,3) + d.substring(3);
			return d
		});
};

function colorScale(csvData){

	//create quantile classes with color scale		
	var color = d3.scale.quantile() //designate quantile scale generator
		.range([
			"#00CE42",
			"#3BD500",
			"#7ED900",
			"#C2DD00",
			"#E57600",
		]);
	
	//build array of all currently expressed values for input domain
	var domainArray = [];
	for (var i in csvData){
		domainArray.push(Number(csvData[i][expressed]));
	};

	//for quantile scale, pass array of expressed values as domain
	color.domain(domainArray);
	
	return color; //return the color scale generator
};


function choropleth(d, recolorMap){
	
	//get data value
	var value = d.properties[expressed];
	//if value exists, assign it a color; otherwise assign gray
	if (value) {
		return recolorMap(value); //recolorMap holds the colorScale generator
	} else {
		return "#ccc";
	};
};

function changeAttribute(attribute, csvData){
	//change the expressed attribute
	expressed = attribute;
	
	//recolor the map
	d3.selectAll(".regions") //select every region
        .transition()
        .duration(1000)
		.style("fill", function(d) { //color enumeration units
			return choropleth(d, colorScale(csvData)); //->
		})
		.select("desc") //replace the color text in each region's desc element
			.text(function(d) {
				return choropleth(d, colorScale(csvData)); //->
			});
};

function format(value){
	
	//format the value's display according to the attribute
	if (expressed != "Population"){
		value = "$"+roundRight(value);
	} else {
		value = roundRight(value);
	};
	
	return value;
};

function roundRight(number){
	
	if (number>=100){
		var num = Math.round(number);
		return num.toLocaleString();
	} else if (number<100 && number>=10){
		return number.toPrecision(4);
	} else if (number<10 && number>=1){
		return number.toPrecision(3);
	} else if (number<1){
		return number.toPrecision(2);
	};
};

function highlight(data){
	
	var props = data.properties; //json properties

	d3.select("#"+props.adm0_code) //select the current region in the DOM
		.style("fill", "#000"); //set the enumeration unit fill to black

	var labelAttribute = "<h1>"+props[expressed]+
		"</h1><br><b>"+expressed+"</b>"; //label content
	var labelName = props.name //html string for name to go in child div
	
	//create info label div
	var infolabel = d3.select("body")
		.append("div") //create the label div
		.attr("class", "infolabel")
		.attr("id", props.adm0_code+"label") //for styling label
		.html(labelAttribute) //add text
		.append("div") //add child div for feature name
		.attr("class", "labelname") //for styling name
		.html(labelName); //add feature name to label
};

function dehighlight(data){
	
	var props = data.properties; //json properties
	var region = d3.select("#"+props.adm0_code); //select the current region
	var fillcolor = region.select("desc").text(); //access original color from desc
	region.style("fill", fillcolor); //reset enumeration unit to orginal color
	
	d3.select("#"+props.adm0_code+"label").remove(); //remove info label
};

function moveLabel() {
	
	var x = d3.event.clientX+10; //horizontal label coordinate based mouse position stored in d3.event
	var y = d3.event.clientY-75; //vertical label coordinate
	d3.select(".infolabel") //select the label div for moving
		.style("margin-left", x+"px") //reposition label horizontal
		.style("margin-top", y+"px"); //reposition label vertical
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = 860,
        chartHeight = 500,
        leftPadding = 55,
        rightPadding = 25,
        topBottomPadding = 25,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");



    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scale.linear()
        .range([463, 0])
        .domain([0, 15000]);

    //set bars for each country
    var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bars " + d.adm0_code;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 120)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Amount of attribute in each country");

    //create vertical axis generator
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);


};
    
//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};    
    
})();