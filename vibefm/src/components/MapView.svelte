<script>
  import { onMount } from "svelte";
  import { scaleLinear, zoom, select } from "d3";
  import { getColor } from "../utils/color";
  import envelopeGlyph from "../glyphs/envelopeGlyph.svelte";

  export let data = [];
  export let onPointClick;
  export let pointRenderer = null;
  export let selectedPoint = null;

  function handleClick(point) {
    if (onPointClick) {
      onPointClick(point);
    }
  }

  let brightnessExtent = [Infinity, -Infinity];

  const size = 900;
  const offset = 5;

  let container; // Reference to the SVG container
  let zoomTransform = { x: 0, y: 0, k: 1 }; // Initial zoom state

  $: xScale = scaleLinear().domain([0, size]).range([0, size]);
  $: yScale = scaleLinear().domain([0, size]).range([0, size]);

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
    xScale = scaleLinear()
      .domain(xExtent)
      .range([offset, size - offset]);
    yScale = scaleLinear()
      .domain(yExtent)
      .range([offset, size - offset]);
  }

  $: data,
    () => {
      console.log(brightnessExtent);
      const allBrightness = data.map((p) => p.analysis.brightness.mean);
      brightnessExtent = [
        0, //Math.min(...allBrightness),
        Math.max(...allBrightness),
      ];
      console.log(brightnessExtent);
    };

  onMount(() => {
    const svg = select(container);

    const zoomBehavior = zoom()
      .scaleExtent([0.5, 5]) // Zoom limits
      .on("zoom", (event) => {
        if (event.sourceEvent.altKey) zoomTransform = event.transform; // Update the transform state
      });

    svg.call(zoomBehavior);

    const allBrightness = data.map((p) => p.analysis.brightness.mean);
    brightnessExtent = [
      0, //Math.min(...allBrightness),
      Math.max(...allBrightness),
    ];
    console.log(brightnessExtent);
  });
</script>

<div class="map-container">
  {#each data as point}
    <div
      class="point"
      style="left: {xScale(point.x)}px; top: {yScale(point.y)}px"
      on:click={() => handleClick(point)}
    ></div>
  {/each}
  <div class="map-container" style="width: {size}px; height: {size}px;">
    <svg
      bind:this={container}
      width={size}
      height={size}
      style="background: #f0f0f0;"
    >
      <g
        transform="translate({zoomTransform.x},{zoomTransform.y}) scale({zoomTransform.k})"
      >
        <!--{#if pointRenderer === "rect"}-->
        {#each data as point}
          {#if point === selectedPoint}
            <rect
              x={xScale(point.x) - 5}
              y={yScale(point.y) - 5}
              width="10"
              height="10"
              class="point"
              fill={getColor(point, brightnessExtent)}
              on:click={() => handleClick(point)}
            ></rect>;
          {:else if pointRenderer === "circle"}
            <circle
              cx={xScale(point.x)}
              cy={yScale(point.y)}
              r="5"
              class="point"
              fill={getColor(point, brightnessExtent)}
              on:click={() => handleClick(point)}
            ></circle>
          {:else if pointRenderer === "glyph"}
            <envelopeGlyph
              data={point.analysis.centroid[0]}
              x={xScale(point.x) - 5}
              y={yScale(point.y) - 5}
              width="10"
              height="10"
              class="point"
              fill={getColor(point, brightnessExtent)}
              on:click={() => handleClick(point)}
            />
          {/if}
        {/each}
        <!--{:else if pointRenderer === "circle"}
          {#each data as point}
            <circle
              cx={xScale(point.x)}
              cy={yScale(point.y)}
              r="5"
              class="point {point === selectedPoint ? 'selected' : ''}"
              fill={point === selectedPoint ? "orange" : "red"}
              on:click={() => handleClick(point)}
            ></circle>
          {/each}
        {/if}-->
      </g>
    </svg>
  </div>
</div>

<style>
  .map-container {
    border: 1px solid #ccc;
    margin: 0 auto;
    overflow: hidden;
  }

  .point {
    stroke: black;
    stroke-width: 0.5;
  }

  .selected {
    fill: orange; /* Color for selected points */
    stroke: black;
    stroke-width: 1;
  }

  .custom-point {
    transform: translate(-50%, -50%);
  }
</style>
