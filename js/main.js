//wrapping everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
var attrArray = ["Net_Generation", "Net_Summer_Capacity", "Average_Retail_Price", "Total_Retail_Sales", "Carbon_Dioxide_Emission"]; //list of attributes
var expressed = attrArray[0]; //initial attribute
var pie, arc, labelArc,chartTitle,colorScale;


//begin script when window loads
window.onload = setMap();
window.onload = donut(expressed);

//set up choropleth map
function setMap(){

   //map frame dimensions
   var width = 700,
       height = 400;
    
   //create a title for the page
   var title = d3.select("body")
       .append("h1")
       .attr("class","main-title")
       .text("State Electricity Profiles");

   //create new svg container for the map
   var map = d3.select("body")
       .append("svg")
       .attr("class", "map")
       .attr("width", width)
       .attr("height", height);

       //create Albers equal area conic projection centered on United States
       var projection = d3.geoAlbers()
        .center([0, 43.5])
        .rotate([98, 4, 0])
        .parallels([45.00, 45.5])
        .scale(800)
        .translate([width / 2, height / 2]);

       //create svg path generator using the projection
       var path = d3.geoPath()
        .projection(projection);

    //use d3.queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/Lab2Data.csv") //load attributes from csv
        .defer(d3.json, "data/StatesTopo.topojson") //load spatial data
        .await(callback);

    //create callback to use variables later
    function callback(error, csvData, usa){

            //place graticule on the map
            setGraticule(map,path)

            //translate topojson to GeoJSON
            var unitedStates = topojson.feature(usa, usa.objects.StatesTopo).features;


            //join csv data to GeoJSON enumeration units
            unitedStates = joinData(unitedStates, csvData);

             //create the color scale
             colorScale = makeColorScale(csvData);
            
            //add enumeration units to the map
            setEnumerationUnits(unitedStates, map, path, colorScale);
            //create the dropdown menu
            createDropdown(csvData);




    };
};


//donut function
function donut(expressed){

  var width = 570 ,
      height = 570 ,
      radius = width/2;

   arc = d3.arc()
      .innerRadius(120)
      .outerRadius(180);

   labelArc = d3.arc()
      .outerRadius(200)
      .innerRadius(180);

    pie = d3.pie()
      .value(function(d){
          return d[expressed];
      });


  var svg = d3.select("body")
      .append("svg")
      .attr("class", "chart")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate("+ width/2 +","+ height/2 +")");


  var lines =   svg.append("g")
  	.attr("class", "lines");

  var labels = svg.append("g")
  	.attr("class", "labels");


  //importing data
  d3.csv("data/Lab2Data.csv", function(error, data){
      if (error) throw error;

      //parsing data
      data.forEach(function(d){
          d.Average_Retail_Price = +d[expressed];
          d.State = d.State;
      });

      //append g elements (arc)
      var g = svg.selectAll(".arc")
          .data(pie(data))
          .enter().append("g")
          .attr("class", "arc");

      var colorScale = makeColorScale(data);


      //append path of the arc
      var arcPath = g.append("path")
          .attr("d", arc)
          .attr("class", function(d){

              return "arc " + d.data.State.replace(/ /g, "_");
          });

          arcPath.style("fill",function(d){ return choropleth(d.data, colorScale);})
          .on("mouseover", function(d){
                    highlight(d.data);
                })
          .on("mouseout", function(d){
           dehighlight(d.data);
             })
          .on("mousemove", moveLabel)

          .transition()
          .ease(d3.easeExp)
          .duration(2000)
          .attrTween("d", pieTween);


        g.append("text")
               .transition()
               .delay(2000)
              .ease(d3.easeLinear)
              .duration(500)
              .attr("transform", function(d) {
              var midAngle = d.endAngle < Math.PI ? d.startAngle/2 + d.endAngle/2 : d.startAngle/2  + d.endAngle/2 + Math.PI ;
              return "translate(" + labelArc.centroid(d)[0] + "," + labelArc.centroid(d)[1] + ") rotate(-90) rotate(" + (midAngle * 180/Math.PI) + ")"; })
              .attr("dy", ".35em")
              .attr('text-anchor',function(midAngle){
                var anchorLocation = midAngle["endAngle"] < Math.PI ? "start" : "end"
                return anchorLocation
              })
              .text(function(d) {return (d.data.State+": "+Math.round(d.data[expressed]));});

                if (expressed == attrArray[0]){
                  chartTitle = "Net Generation (MWh) per capita"
                  chartTitle2 = ""
                }
                else if (expressed == attrArray[1]){
                  chartTitle = "Net Summer Capacity (GW)"
                  chartTitle2 = ""
                }
                else if (expressed == attrArray[2]){
                  chartTitle = "Average Retail Price (cents/kWh)"
                  chartTitle2 = ""
                }
                else if (expressed == attrArray[3]){
                  chartTitle = "Total Retail Sales (MWh) per capita"
                  chartTitle2= ""
                }
                else if (expressed == attrArray[4]){
                  chartTitle = "Carbon Dioxide Emission per capita in metric tons"
                  chartTitle2= ""
                };



              svg.append("text")
              .attr("x", 0)
              .attr("y", 15 )
              .attr("text-anchor", "middle")
              .style("font-size", "60px")
              .style("font-weight","bold")
              .html("2019");


          var desc = arcPath.append("desc")
          .text(function(d){

              var fill = choropleth(d.data, colorScale)
              return '{"fill":"'+fill+'"}';
          });

          var title = d3.select("body")
          .append("div")
          .attr("class","large-title")
          .attr("style","max-width:700px")
          .html("<h1>"+chartTitle+" " + chartTitle2 +"</h1>");



  })
  //function to interpolate the arcs in data space
  function pieTween(b) {
    b.innerRadius = 0;
    var i = d3.interpolate({startAngle: 0, endAngle: 0}, b);
    return function(t) {return arc(i(t));};
  };

};

//function for creating background graticule
function setGraticule(map,path){
  //create graticule generator
   var graticule = d3.geoGraticule()
       .step([25, 25]); //place graticule lines every 25 degrees of longitude and latitude

   //create graticule lines
   var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
       .data(graticule.lines()) //bind graticule lines to each element to be created
       .enter() //create an element for each datum
       .append("path") //append each element to the svg as a path element
       .attr("class", "gratLines") //assign class for styling
       .attr("d", path); //project graticule lines
};

//loops used to accomplish the csv to geojson attribute data transfer
function joinData(states, csvData){
  //loop through csv to assign each set of csv attribute values to geojson region
  for (var i=0; i<csvData.length; i++){
      var csvRegion = csvData[i]; //the current region
      var csvKey = csvRegion.State; //the CSV primary key

      //loop through geojson regions to find correct region
      for (var a=0; a<states.length; a++){

          var geojsonProps = states[a].properties; //the current region geojson properties
          var geojsonKey = geojsonProps.name; //the geojson primary key

          //where primary keys match, transfer csv data to geojson properties object
          if (geojsonKey == csvKey){

              //assign all attributes and values
              attrArray.forEach(function(attr){
                  var val = parseFloat(csvRegion[attr]); //get csv attribute value
                  geojsonProps[attr] = val; //assign attribute and value to geojson properties
              });
          };
      };
  };

    return states;
};

//function to test for data value and return color
function choropleth(props, colorScale){
   
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {

        return "#CCC";
    };
};

//adding enumeration units to the map
function setEnumerationUnits(unitedStates, map, path, colorScale){
  var states = map.selectAll(".states")
  .data(unitedStates)
  .enter()
  .append("path")
  .attr("class", function(d){
      stateName = d.properties.name;
      return "states " + d.properties.name.replace(/ /g, "_");
  })
  .attr("d", path)
  .style("fill", function(d){
    return choropleth(d.properties,colorScale);
  })
  .on("mouseover", function(d){
            highlight(d.properties);
        })
  .on("mouseout", function(d){
           dehighlight(d.properties);
       })
  .on("mousemove", moveLabel);
   var desc = states.append("desc")
   .text(function(d){

       var fill = choropleth(d.properties, colorScale)
       return '{"fill":"'+fill+'"}';
   });

   var sources = d3.select("body")
      .append("div")
      .attr("class","source")
      .html("<span>Data Source: U.S. Energy Information Administration - Independent Statistics & Analysis<br><br>Abbreviations: kWh (kilowatt-hour), MWh (megawatt-hour), GW (gigawatt), Mt (metric ton)</span>")


};

//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#fef0d9",
        "#fdcc8a",
        "#fc8d59",
        "#e34a33",
        "#b30000"
    ];


    //create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();

    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);

    return colorScale;
};

//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value,csvData)
        });

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d })
        .text(function(d){
          if (d == attrArray[0]){
            dropMenu = "Net Generation (MWh)"
            return dropMenu
          }
          else if (d == attrArray[1]){
            dropMenu = "Net Summer Capacity (GW)"
            return dropMenu
          }
          else if (d == attrArray[2]){
            dropMenu = "Average Retail Price (cents/kWh)"
            return dropMenu
          }
          else if (d == attrArray[3]){
            dropMenu = "Total Retail Sales (MWh)"
            return dropMenu
          }
          else if (d == attrArray[4]){
            dropMenu = "Carbon Dioxide Emission (Mt)"
            return dropMenu
          };
        });
};

//dropdown change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var states = d3.selectAll(".states")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });

    var desc = states.select("desc")
    .text(function(d){

        var fill = choropleth(d.properties, colorScale)
        return '{"fill":"'+fill+'"}';
    });

    var removeArcs = d3.select(".chart").remove();

    d3.select(".large-title").remove();

    donut(expressed)


};

//function to highlight enumeration units
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.State.replace(/ /g, "_"))
        .style("fill", "yellow")
        .style("stroke", "black")
        .style("stroke-width", "3");

        setLabel(props);
};


//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.State.replace(/ /g, "_"))
        .style("fill", function(){
            return getStyle(this, "fill")
        })
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){

        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
    //remove info label
    d3.select(".infolabel")
       .remove();
};

//function to create dynamic label
function setLabel(props){

  if (expressed == attrArray[0]){
    labelTitle = "Net Generation (MWh)"
  }
  else if (expressed == attrArray[1]){
    labelTitle = "Net Summer Capacity (GW)"
  }
  else if (expressed == attrArray[2]){
    labelTitle = "Average Retail Price (cents/kWh)"
  }
  else if (expressed == attrArray[3]){
    labelTitle = "Total Retail Sales (MWh)"
  }
  else if (expressed == attrArray[4]){
    labelTitle = "Carbon Dioxide Emission (Mt)"
  };
    //label content
    var labelAttribute = "<h1>" + Math.round(props[expressed]) +
        "</h1><b>" + labelTitle + "</b>";


    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.State + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.State);

};

//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1;

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};



})();//last line of main.js