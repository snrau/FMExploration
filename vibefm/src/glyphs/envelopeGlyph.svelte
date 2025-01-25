<script>
    import * as d3 from "d3";

    export let data;
    export let width = 20; // Width of the mini plot
    export let height = 20; // Height of the mini plot
    export let onClick;
    export let x, y;
    export let fill;

    let svg;

    // Scales for the plot
    let xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d, i) => i))
        .range([0, width]);
    let yScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d, i) => d))
        .range([height, 0]);

    // Line generator
    let line = d3
        .line()
        .x((d, i) => xScale(i))
        .y((d, i) => yScale(d))
        .curve(d3.curveLinear);

    // Draw the plot
    function drawPlot() {
        const svgElement = d3.select(svg);
        svgElement.selectAll("*").remove(); // Clear any existing content

        // Add line
        svgElement
            .append("path")
            .datum(data)
            .attr("d", line)
            .attr("stroke", fill)
            .attr("stroke-width", 1)
            .attr("fill", fill);
    }

    $: drawPlot();
</script>

<svg
    bind:this={svg}
    {width}
    {height}
    style="position: absolute; transform: translate({x}px, {y}px);"
></svg>

<style>
    svg {
        pointer-events: none; /* Disable pointer events to allow map interaction */
    }
</style>
