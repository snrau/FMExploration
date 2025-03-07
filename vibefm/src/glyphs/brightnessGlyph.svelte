<script>
    import * as d3 from "d3";
    import { onMount } from "svelte";

    export let data;
    export let width = 20; // Width of the mini plot
    export let height = 20; // Height of the mini plot
    export let onClick;
    export let x;
    export let y;
    export let fill;
    export let selected;

    let svg;

    let padding = 1;

    // Scales for the plot
    let xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d, i) => i))
        .range([padding, width - padding]);
    let yScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d, i) => d))
        .range([height - padding, padding]);

    // Line generator
    let background = null;
    let path = null;

    // Extract important points
    function getImportantPoints(data) {
        if (!data || data.length === 0) return [];

        const importantPoints = [];
        importantPoints.push({ index: 0, value: data[0] }); // Add the first point

        let lastMax = null;
        for (let i = 1; i < data.length - 1; i++) {
            if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
                // Local maximum
                importantPoints.push({ index: i, value: data[i] });
                lastMax = i;
            }
        }

        let lastLowStart = null;
        for (let i = lastMax + 1; i < data.length - 1; i++) {
            if (
                data[i] >= data[i - 1] &&
                data[i] - data[data.length - 1] < 0.0001
            ) {
                lastLowStart = { index: i, value: data[i] };
                break;
            }
        }

        // Add the first point of the low stretch (last local minimum)
        if (lastLowStart) {
            importantPoints.push(lastLowStart);
        }

        importantPoints.push({
            index: data.length - 1,
            value: data[data.length - 1],
        }); // Add the last point

        return importantPoints.sort((a, b) => a.index - b.index);
    }

    // Draw the plot
    function drawPlot() {
        const svgElement = d3.select(svg);
        svgElement.selectAll("*").remove(); // Clear any existing content

        background = svgElement
            .append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("pointer-events", "all")
            .attr("stroke", fill)
            .attr("stroke-width", selected ? 2 : 1)
            .attr("fill", selected ? "white" : "transparent")
            .on("click", () => onClick());

        const importantPoints = getImportantPoints(data);
        let line = d3
            .line()
            .x((d, i) => xScale(d.index))
            .y((d, i) => yScale(d.value))
            .curve(d3.curveCatmullRom);

        // Add line
        path = svgElement
            .append("path")
            .datum(importantPoints)
            .attr("d", line)
            .attr("stroke", fill)
            .attr("stroke-width", selected ? 3 : 1)
            .attr("fill", "none");
    }

    function adjustSelect() {
        if(background)
            background
                .attr("stroke-width", selected ? 2 : 1)
                .attr("fill", selected ? "white" : "transparent");
        if(path)
            path.attr("stroke-width", selected ? 3 : 1);
    }

    function adjustFill() {
        if(background)
        background.attr("stroke", fill);
        if(path)
        path.attr("stroke", fill);
    }

    $: fill, adjustFill();

    $: data, drawPlot();
    $: selected, adjustSelect();

    onMount(() => {
        if (data && data.length) drawPlot();
    });

    // pointer-events: none; /* Disable pointer events to allow map interaction */
</script>

<svg
    bind:this={svg}
    {width}
    {height}
    {x}
    {y}
    on:click={() => onClick()}
    viewBox={`0 0 ${width} ${height}`}
></svg>

<style>
    svg {
        position: absolute;
    }
</style>
