<script>
    import * as d3 from "d3";
    import { onMount } from "svelte";
    import EnvelopeSimpleGlyph from "./envelopeSimpleGlyph.svelte";
    import { dx7Parameters } from "../utils/dexed";
    import BrightnessGlyph from "./brightnessGlyph.svelte";
    import ConfigMatrixGlyph from "./configMatrixGlyph.svelte";

    export let data;
    export let width = 80; // Width of the mini plot
    export let height = 70; // Height of the mini plot
    export let onClick;
    export let class1;
    export let x;
    export let y;
    export let fill;
    export let selected;
    export let pointRenderer;
    export let selectedPoint;
    export let interpolation;

    let svg;

    function drawPoint() {
        const svgElement = d3.select(svg);
        svgElement.selectAll("text").remove();

        // Background (for selection highlight)
        /*
        svgElement
            .append("circle")
            .attr("cx", width / 2)
            .attr("cy", (height * 2) / 3)
            .attr("r", selected ? 6 : 4)
            .attr("class", class1)
            .attr("fill", fill)
            .attr("stroke", selected ? "black" : "none")
            .attr("stroke-width", selected ? 2 : 0);
        */

        // Label above the point
        svgElement
            .append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("class", class1)
            .attr("text-anchor", "middle")
            .attr("font-size", "20px")
            .attr("fill", "black")
            .text(data.label + interpolation ? "(int)" : "");
    }

    /*$: data, drawPoint();
    $: selected, drawPoint();

    onMount(() => {
        if (data) drawPoint();
    });
    */

    let label = data.label;
    if (interpolation) label = label + " (int)";

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
>
    <text
        x="50%"
        y="10"
        {fill}
        text-anchor="middle"
        font-size="20px"
        dy=".3em"
        class:class1
    >
        {interpolation ? data.label + " (int)" : data.label}
    </text>
    {#if pointRenderer === "circle" || (pointRenderer === "config" && interpolation)}
        <circle
            cx={width / 2}
            cy={(height * 2) / 3}
            r={selected ? 6 : 4}
            class="point"
            {fill}
            stroke={selected ? "black" : "none"}
            stroke-width={selected ? 2 : 0}
        ></circle>
    {:else if pointRenderer === "envelope"}
        <EnvelopeSimpleGlyph
            data={data.analysis.rms[0]}
            x={20}
            y={20}
            width={width / 2}
            height={height - 30}
            {fill}
            {onClick}
            {selected}
            extent={[0, 0]}
        />
    {:else if pointRenderer === "brightness"}
        <BrightnessGlyph
            data={data.analysis.centroid[0]}
            x={20}
            y={20}
            width={width / 2}
            height={height - 30}
            {fill}
            {onClick}
            {selected}
        />
    {:else if pointRenderer === "config"}
        <ConfigMatrixGlyph
            config={data.config}
            x={10}
            y={20}
            cellSize={7}
            {onClick}
            parameters={Object.entries(dx7Parameters)}
            selection={data === selectedPoint ? null : selectedPoint}
        />
    {/if}
</svg>

<style>
    svg {
        position: absolute;
    }
</style>
