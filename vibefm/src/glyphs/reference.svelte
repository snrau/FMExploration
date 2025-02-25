<script>
    import * as d3 from "d3";
    import { onMount } from "svelte";

    export let data;
    export let width = 80; // Width of the mini plot
    export let height = 70; // Height of the mini plot
    export let onClick;
    export let class1;
    export let x;
    export let y;
    export let fill;
    export let selected;

    let svg;

    function drawPoint() {
        const svgElement = d3.select(svg);
        svgElement.selectAll("*").remove();

        // Background (for selection highlight)
        svgElement
            .append("circle")
            .attr("cx", width / 2)
            .attr("cy", (height * 2) / 3)
            .attr("r", selected ? 6 : 4)
            .attr("class", class1)
            .attr("fill", fill)
            .attr("stroke", selected ? "black" : "none")
            .attr("stroke-width", selected ? 2 : 0);

        // Label above the point
        svgElement
            .append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("class", class1)
            .attr("text-anchor", "middle")
            .attr("font-size", "20px")
            .attr("fill", "black")
            .text(data);
    }

    $: data, drawPoint();
    $: selected, drawPoint();

    onMount(() => {
        if (data) drawPoint();
    });

    // pointer-events: none; /* Disable pointer events to allow map interaction */
</script>

<svg
    bind:this={svg}
    {width}
    {height}
    class={class1}
    {x}
    {y}
    on:click={onClick}
    viewBox={`0 0 ${width} ${height}`}
></svg>

<style>
    svg {
        position: absolute;
    }
</style>
