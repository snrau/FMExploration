<script>
    import { filter } from "@observablehq/plot";
    import * as d3 from "d3";
    import { onMount } from "svelte";

    // Input data
    export let parameters = []; // Array of objects with {index, change, max}
    export let config = []; // Array of values corresponding to indices
    export let cellSize = 5; // Width of the mini plot
    export let onClick;
    export let x;
    export let y;
    export let selection = null;

    const rows = 7; // Number of rows
    const cols = 6; // Number of columns

    let svg;

    // Dimensions
    const padding = 2;
    const width = cols * cellSize;
    const height = rows * cellSize;

    // Scales
    const colorScaleViridis = d3.scaleSequential(d3.interpolateViridis);

    const colorScaleBlRd = d3
        .scaleSequential(d3.interpolateRdBu)
        .domain([1, -1]);

    // Filtered data
    $: filteredData = parameters
        .filter((d) => d[1].change === true && d[1].number < 145)
        .map((d) => {
            const baseValue = config[d[1].number];
            let value = baseValue;

            if (selection && selection.config) {
                const selectionValue = selection.config[d[1].number];
                value = baseValue - selectionValue; // Difference normalized by max
                console.log(value, baseValue, selectionValue);
            }

            return {
                ...d[1],
                name: d[0],
                value,
                color:
                    selection && selection.config
                        ? colorScaleBlRd(value / d[1].max) // Use BlRd scale for differences
                        : colorScaleViridis(value / d[1].max),
            };
        });

    function drawMatrix() {
        const svgElement = d3.select(svg);
        svgElement.selectAll("*").remove(); // Clear previous content

        console.log(filteredData);

        const background = svgElement
            .append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("stroke", "black")
            .attr("pointer-events", "all") // Ensure it captures click events
            .attr("fill", "transparent");

        // Create matrix cells
        const cells = svgElement
            .selectAll("rect.cell")
            .data(filteredData)
            .join("rect")
            .attr("class", "cell")
            .attr("x", (d, i) => (i % cols) * cellSize + padding / 2)
            .attr("y", (d, i) => Math.floor(i / cols) * cellSize + padding / 2)
            .attr("width", cellSize - padding)
            .attr("height", cellSize - padding)
            .attr("fill", (d) => d.color)
            .attr("stroke", "none");
    }

    $: config, selection, drawMatrix();

    onMount(() => {
        drawMatrix();
    });
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
