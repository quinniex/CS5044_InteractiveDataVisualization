var margin = {top: 50, right: 50, bottom: 50, left: 50},
    width = 900 - margin.left - margin.right,
    height = 900- margin.top - margin.bottom;

var data = {};

var x_scale = d3.scaleLinear()
    .range([0, width]);


var y_scale=d3.scaleLinear()
    .range([height, 0]);

//source:http://bl.ocks.org/Ctuauden/52d057254665400f561ef73cb6e5841a
var color = d3.scaleOrdinal(d3.schemeCategory20);

var y_axis = d3.axisLeft(y_scale).tickSize(10).tickPadding(6);
var x_axis = d3.axisBottom(x_scale).tickSize(10).tickPadding(6);

var svg = d3.select("#myVis").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var tooltip = d3.select("#tooltip");

//source: https://bl.ocks.org/martinjc/f2241a09bd18caad10fc7249ca5d7816
function draw(year) {


    var myData = data[year];

    var t = d3.transition()
        .duration(1000);

    //initialise graph
    init(myData);


    //filter data based on gender
    var selectGender = d3.select('#gender');

    selectGender.on('change', function () {

        var gender = this.value;

        var dataNested1 = d3.nest()
            .key(function (d) { return d.Sex; })
            .entries(myData);

        var dataFiltered1 ;

        //console.log(this.value);
        dataFiltered1 = dataNested1.filter(function (d) { return d.key === gender });

        init(dataFiltered1[0].values);
        $(this).val('');

    });

    //filter data based on crime
    var selectCrime = d3.select('#crime');

    selectCrime.on('change', function () {

        var crime = this.value;

        var dataNested2 = d3.nest()
            .key(function (d) { return d.Crime; })
            .entries(myData);

        var dataFiltered2 ;

        //console.log(this.value);

        dataFiltered2 = dataNested2.filter(function (d) { return d.key === crime });

        init(dataFiltered2[0].values);
        $(this).val('');

    });


    //draw initial graph
    function init(csv_data) {


        //remove the previous elements
        svg.selectAll("g").remove();


        var seriesNames = d3.keys(csv_data[0])
            .filter(function(d) {
                if (d !== "Race" && d !== "Sex" && d !== "State" && d !== "Crime" && d !== "Convicted" && d !== "Exonerated" && d !== "Sentence" && d !== "Lost" && d !== "id") {
                    return d;
                }
            })
            .sort();

        //console.log(seriesNames);

        // Map the data to an array of arrays
        let series = seriesNames.map(function(series) {
            return csv_data.map(function(d) {

                return {y: +d.id, x: +d[series]};

            });
        });

        y_scale.domain(d3.extent(d3.merge(series), function(d) { return d.y; })).nice();

        x_scale.domain(d3.extent(d3.merge(series), function(d) { return d.x; })).nice();

        // Add the x-axis.
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .text('age of exoneration')
            .call(x_axis);

        // text label for the x axis
        svg.append("text")
            .attr("transform",
                "translate(" + (width/2) + " ," +
                (height + margin.top-10) + ")")
            .style("text-anchor", "middle")
            .text("Age");

        // Add the y-axis.
        svg.append("g")
            .transition(t)
            .attr("class", "y axis")
            .call(y_axis)

        // text label for the y axis
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Number of Cases");

        // Add points
         svg.selectAll(".series")
            .data(series)
            .enter()
            .append("g")
            .attr("class", "series")
            .selectAll(".point")
            .data(function(d) { return d; })
            .enter().append("circle")
            .transition(t)
            .attr("class", "point")
            .attr("r", 7)
            .attr("cx", function(d) { return x_scale(d.x); })
            .attr("cy", function(d) { return y_scale(d.y); });


         //Add line between two points
        svg.selectAll(".series")
            .append("g")
            .selectAll("line").data(csv_data)
            .enter().append("line")
            .transition(t)
            .attr("x1", function(d){ return x_scale(d.Age1); })
            .attr("y1", function(d){ return y_scale(d.id); })
            .attr("x2", function(d){ return x_scale(d.Age2);})
            .attr("y2", function(d){ return y_scale(d.id); })
            .attr("stroke-width", 3);

        //Add tooltip
        svg.selectAll("line")
            .style("stroke", function(d) { return color(d.Race);})
            .on("mouseover", function(d) {
                tooltip
                    .transition()
                    .duration(500)
                    .style("left", d3.event.pageX - 50 + "px")
                    .style("top", d3.event.pageY - 70 + "px")
                    .style("display", "inline-block")
                    .text("Conviction Age:"+(d.Age1)+  ", " + "Exoneration Age:" + (d.Age2) +  ", " + "Years Lost:"+ (d.Lost));
            })
            .on("mouseout", function(d) {
                tooltip
                    .transition()
                    .duration(500)
                    .style("display", "none");
            });


        //Add legend
        var legend = svg
            .selectAll(".legend")
            .data(color.domain())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

        //Add onclick to legend. source: http://bl.ocks.org/Ctuauden/52d057254665400f561ef73cb6e5841a
        var clicked = "";

        legend.append("rect")
            .attr("x", width - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", function(d) { return color(d); })
            .on("click",function(d){
                d3.selectAll("line").style("opacity",1)

                if (clicked !== d){
                    d3.selectAll("line")
                        .filter(function(e){
                            return e.Race !== d;
                        })
                        .style("opacity",0.1)
                    clicked = d
                }
                else{
                    clicked = ""
                }
            });

        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) { return d; });

    }

}

        d3.queue()
            .defer(d3.csv, 'data/data_2018.csv')
            .defer(d3.csv, 'data/data_2017.csv')
            .defer(d3.csv, 'data/data_2016.csv')
            .defer(d3.csv, 'data/data_2015.csv')
            .defer(d3.csv, 'data/data_2014.csv')
            .defer(d3.csv, 'data/data_2013.csv')
            .defer(d3.csv, 'data/data_2012.csv')
            .defer(d3.csv, 'data/data_2011.csv')
            .defer(d3.csv, 'data/data_2010.csv')
            .defer(d3.csv, 'data/data_2009.csv')
            .defer(d3.csv, 'data/data_2008.csv')
            .await(function(error, d2018, d2017, d2016, d2015, d2014, d2013, d2012, d2011, d2010, d2009, d2008) {
                data['2008'] = d2008;
                data['2009'] = d2009;
                data['2010'] = d2010;
                data['2011'] = d2011;
                data['2012'] = d2012;
                data['2013'] = d2013;
                data['2014'] = d2014;
                data['2015'] = d2015;
                data['2016'] = d2016;
                data['2017'] = d2017;
                data['2018'] = d2018;
                draw('2018');
            });

        var slider=d3.select('#year');
        slider.on('change', function(d) {
            console.log("updated");
            draw(this.value)


});





