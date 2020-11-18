!function(){var s,d,c,u,f,h=["Net_Generation","Net_Summer_Capacity","Average_Retail_Price","Total_Retail_Sales","Carbon_Dioxide_Emission"],v=h[0];function m(i){d=d3.arc().innerRadius(120).outerRadius(180),c=d3.arc().outerRadius(200).innerRadius(180),s=d3.pie().value(function(t){return t[i]});var l=d3.select("body").append("svg").attr("class","chart").attr("width",570).attr("height",570).append("g").attr("transform","translate(285,285)");l.append("g").attr("class","lines"),l.append("g").attr("class","labels");function o(t){t.innerRadius=0;var e=d3.interpolate({startAngle:0,endAngle:0},t);return function(t){return d(e(t))}}d3.csv("data/Lab2Data.csv",function(t,e){if(t)throw t;e.forEach(function(t){t.Average_Retail_Price=+t[i],t.State});var a=l.selectAll(".arc").data(s(e)).enter().append("g").attr("class","arc"),n=b(e),r=a.append("path").attr("d",d).attr("class",function(t){return"arc "+t.data.State.replace(/ /g,"_")});r.style("fill",function(t){return g(t.data,n)}).on("mouseover",function(t){y(t.data)}).on("mouseout",function(t){M(t.data)}).on("mousemove",A).transition().ease(d3.easeExp).duration(2e3).attrTween("d",o),a.append("text").transition().delay(2e3).ease(d3.easeLinear).duration(500).attr("transform",function(t){var e=t.endAngle<Math.PI?t.startAngle/2+t.endAngle/2:t.startAngle/2+t.endAngle/2+Math.PI;return"translate("+c.centroid(t)[0]+","+c.centroid(t)[1]+") rotate(-90) rotate("+180*e/Math.PI+")"}).attr("dy",".35em").attr("text-anchor",function(t){return t.endAngle<Math.PI?"start":"end"}).text(function(t){return t.data.State+": "+Math.round(t.data[i])}),i==h[0]?(u="Net Generation (MWh) per capita",chartTitle2=""):i==h[1]?(u="Net Summer Capacity (GW)",chartTitle2=""):i==h[2]?(u="Average Retail Price (cents/kWh)",chartTitle2=""):i==h[3]?(u="Total Retail Sales (MWh) per capita",chartTitle2=""):i==h[4]&&(u="Carbon Dioxide Emission per capita in metric tons",chartTitle2=""),l.append("text").attr("x",0).attr("y",15).attr("text-anchor","middle").style("font-size","60px").style("font-weight","bold").html("2019");r.append("desc").text(function(t){return'{"fill":"'+g(t.data,n)+'"}'}),d3.select("body").append("div").attr("class","large-title").attr("style","max-width:700px").html("<h1>"+u+" "+chartTitle2+"</h1>")})}function g(t,e){var a=parseFloat(t[v]);return"number"!=typeof a||isNaN(a)?"#CCC":e(a)}function b(t){for(var e=d3.scaleThreshold().range(["#fef0d9","#fdcc8a","#fc8d59","#e34a33","#b30000"]),a=[],n=0;n<t.length;n++){var r=parseFloat(t[n][v]);a.push(r)}return(a=ss.ckmeans(a,5).map(function(t){return d3.min(t)})).shift(),e.domain(a),e}function y(t){d3.selectAll("."+t.State.replace(/ /g,"_")).style("fill","yellow").style("stroke","black").style("stroke-width","3");!function(t){v==h[0]?labelTitle="Net Generation (MWh)":v==h[1]?labelTitle="Net Summer Capacity (GW)":v==h[2]?labelTitle="Average Retail Price (cents/kWh)":v==h[3]?labelTitle="Total Retail Sales (MWh)":v==h[4]&&(labelTitle="Carbon Dioxide Emission (Mt)");var e="<h1>"+Math.round(t[v])+"</h1><b>"+labelTitle+"</b>";d3.select("body").append("div").attr("class","infolabel").attr("id",t.State+"_label").html(e).append("div").attr("class","labelname").html(t.State)}(t)}function M(t){d3.selectAll("."+t.State.replace(/ /g,"_")).style("fill",function(){return e(this,"fill")}).style("stroke",function(){return e(this,"stroke")}).style("stroke-width",function(){return e(this,"stroke-width")});function e(t,e){var a=d3.select(t).select("desc").text();return JSON.parse(a)[e]}d3.select(".infolabel").remove()}function A(){var t=d3.select(".infolabel").node().getBoundingClientRect().width,e=d3.event.clientX+10,a=d3.event.clientY-75,n=d3.event.clientX-t-10,r=d3.event.clientY+25,i=d3.event.clientX>window.innerWidth-t-20?n:e,l=d3.event.clientY<75?r:a;d3.select(".infolabel").style("left",i+"px").style("top",l+"px")}window.onload=function(){d3.select("body").append("h1").attr("class","main-title").text("State Electricity Profiles");var u=d3.select("body").append("svg").attr("class","map").attr("width",700).attr("height",400),t=d3.geoAlbers().center([0,43.5]).rotate([98,4,0]).parallels([45,45.5]).scale(800).translate([350,200]),p=d3.geoPath().projection(t);d3.queue().defer(d3.csv,"data/Lab2Data.csv").defer(d3.json,"data/StatesTopo.topojson").await(function(t,e,a){var n,r,i;n=u,r=p,i=d3.geoGraticule().step([25,25]),n.selectAll(".gratLines").data(i.lines()).enter().append("path").attr("class","gratLines").attr("d",r);var l,o,s,d,c=function(t,e){for(var a=0;a<e.length;a++)for(var n=e[a],r=n.State,i=0;i<t.length;i++){var l=t[i].properties;l.name==r&&h.forEach(function(t){var e=parseFloat(n[t]);l[t]=e})}return t}(c=topojson.feature(a,a.objects.StatesTopo).features,e);f=b(e),l=c,o=p,s=f,u.selectAll(".states").data(l).enter().append("path").attr("class",function(t){return stateName=t.properties.name,"states "+t.properties.name.replace(/ /g,"_")}).attr("d",o).style("fill",function(t){return g(t.properties,s)}).on("mouseover",function(t){y(t.properties)}).on("mouseout",function(t){M(t.properties)}).on("mousemove",A).append("desc").text(function(t){return'{"fill":"'+g(t.properties,s)+'"}'}),d3.select("body").append("div").attr("class","source").html("<span>Data Source: U.S. Energy Information Administration - Independent Statistics & Analysis<br><br>Abbreviations: kWh (kilowatt-hour), MWh (megawatt-hour), GW (gigawatt), Mt (metric ton)</span>"),d=e,d3.select("body").append("select").attr("class","dropdown").on("change",function(){!function(t,e){v=t;var a=b(e);d3.selectAll(".states").transition().duration(1e3).style("fill",function(t){return g(t.properties,a)}).select("desc").text(function(t){return'{"fill":"'+g(t.properties,a)+'"}'}),d3.select(".chart").remove();d3.select(".large-title").remove(),m(v)}(this.value,d)}).selectAll("attrOptions").data(h).enter().append("option").attr("value",function(t){return t}).text(function(t){return t}).text(function(t){return t==h[0]?(dropMenu="Net Generation (MWh)",dropMenu):t==h[1]?(dropMenu="Net Summer Capacity (GW)",dropMenu):t==h[2]?(dropMenu="Average Retail Price (cents/kWh)",dropMenu):t==h[3]?(dropMenu="Total Retail Sales (MWh)",dropMenu):t==h[4]?(dropMenu="Carbon Dioxide Emission (Mt)",dropMenu):void 0})})}(),window.onload=m(v)}();