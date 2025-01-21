<script>
    import * as d3 from "d3";

    export let data = [];
    export let onPointClick;

    function handleClick(point) {
        console.log(point, onPointClick);
        if (onPointClick) {
            onPointClick(point);
        }
    }

    const size = 900;
    const offset = 5;

    $: xScale = d3.scaleLinear().domain([0, size]).range([0, size]);
    $: yScale = d3.scaleLinear().domain([0, size]).range([0, size]);

    $: if (data.length) {
        // Compute extents
        const xExtent = [
            Math.min(...data.map((p) => p.x)),
            Math.max(...data.map((p) => p.x)),
        ];
        const yExtent = [
            Math.min(...data.map((p) => p.y)),
            Math.max(...data.map((p) => p.y)),
        ];

        // Create linear scales
        xScale = d3
            .scaleLinear()
            .domain(xExtent)
            .range([offset, size - offset]);
        yScale = d3
            .scaleLinear()
            .domain(yExtent)
            .range([offset, size - offset]);
    }
</script>

<div class="map-container">
    {#each data as point}
        <div
            class="point"
            style="left: {xScale(point.x)}px; top: {yScale(point.y)}px"
            on:click={() => handleClick(point)}
        ></div>
    {/each}
</div>

<style>
    .map-container {
        width: 100%;
        height: 100%;
        position: relative;
        background-color: #eef;
        border: 1px solid #ddd;
    }

    .point {
        position: absolute;
        width: 10px;
        height: 10px;
        background-color: red;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        cursor: pointer;
    }
</style>
