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
    export let extent;

    let svg;

    let padding = 2;

    // Scales for the plot
    let xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d, i) => i))
        .range([padding, width - padding]);

    extent = d3.extent(data, (d, i) => d);
    let yScale = d3
        .scaleLinear()
        .domain(extent)
        .range([height - padding, padding]);

    // Line generator
    let background = null;
    let path = null;

    // Extract important points
    function getImportantPoints(data) {
        if (!data || data.length === 0) return [];

        const importantPoints = [];
        importantPoints.push({ index: 0, value: 0 }); // Add the first point
        importantPoints.push({ index: 1, value: data[1] });

        let lastMax = null;
        let first = true;

        for (let i = 1; i < data.length - 1; i++) {
            if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
                // Local maximum
                if (first) {
                    importantPoints.push({ index: i, value: data[i] });
                    first = false;
                }
                lastMax = { index: i, value: data[i] };
            }
        }
        importantPoints.push(lastMax);

        let lastTurning = null;
        let added = false;
        for (let i = lastMax.index + 1; i < data.length - 2; i++) {
            if (
                data[i - 1] - data[i] < data[i] - data[i + 1] + 0.000001 &&
                data[i] - data[data.length - 1] > 0.001
            ) {
                lastTurning = { index: i, value: data[i] };
                importantPoints.push(lastTurning);
            }
        }

        const startLoop = lastTurning !== null ? lastTurning : lastMax;

        let lastLowStart = null;
        for (let i = startLoop.index + 1; i < data.length - 1; i++) {
            if (
                data[i] <= data[i - 1] &&
                data[i] - data[data.length - 1] < 0.0001
            ) {
                lastLowStart = { index: i, value: data[i] };
                break;
            }
        }

        // Add the first point of the low stretch (last local minimum)
        if (lastLowStart !== null) {
            importantPoints.push(lastLowStart);
        } else {
            importantPoints.push({
                index: data.length - 1,
                value: data[data.length - 1],
            }); // Add the last point
        }

        const r = importantPoints.sort((a, b) => a.index - b.index);

        return r;
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
            .curve(d3.curveLinear);

        // Add line
        path = svgElement
            .append("path")
            .datum(importantPoints)
            .attr("d", line)
            .attr("stroke", fill)
            .attr("stroke-width", selected ? 3 : 1)
            .attr("fill", "none")
            .on("click", () => onClick());
    }

    function adjustSelect() {
        background
            .attr("stroke-width", selected ? 2 : 1)
            .attr("fill", selected ? "white" : "transparent");
        path.attr("stroke-width", selected ? 3 : 1);
    }

    function adjustFill() {
        background.attr("stroke", fill);
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
