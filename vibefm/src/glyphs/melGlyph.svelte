<script>
    import * as d3 from "d3";
    import { onMount } from "svelte";

    export let data;
    export let width = 20; // Width of the mini plot
    export let height = 20; // Height of the mini plot
    export let onClick;
    export let x;
    export let y;
    export let selected;

    let svg;

    // Construct the image path dynamically
    let imagePath = "";

    onMount(() => {
        const folder = data.analysis.sampled ? "sampled" : "reference";
        imagePath = `./${folder}/${data.label}_mel_glyph.png`;
    });

    // pointer-events: none; /* Disable pointer events to allow map interaction */
</script>

<svg
    bind:this={svg}
    {width}
    {height}
    {x}
    {y}
    on:click={onClick}
    viewBox={`0 0 ${width} ${height}`}
>
    <image
        href={imagePath}
        {width}
        {height}
        preserveAspectRatio="xMidYMid slice"
    /></svg
>

<style>
    svg {
        position: absolute;
    }
</style>
