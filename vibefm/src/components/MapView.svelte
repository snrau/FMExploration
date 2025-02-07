<script>
  import { onMount } from "svelte";
  import { scaleLinear, zoom, select } from "d3";
  import { getColor } from "../utils/color";
  import EnvelopeGlyph from "../glyphs/envelopeGlyph.svelte";
  import EnvelopeSimpleGlyph from "../glyphs/envelopeSimpleGlyph.svelte";
  import BrightnessGlyph from "../glyphs/brightnessGlyph.svelte";
  import { dx7Parameters } from "../utils/dexed";
  import ConfigMatrixGlyph from "../glyphs/configMatrixGlyph.svelte";
  import { data } from "../utils/stores";

  export let onPointClick;
  export let pointRenderer = null;
  export let pointColor = null;
  export let selectedPoint = null;

  function handleClick(point) {
    if (onPointClick) {
      onPointClick(point);
    }
  }

  let brightnessExtent = [Infinity, -Infinity];
  let rmsExtent = [Infinity, -Infinity];

  const size = 1800;
  const offset = 5;

  const glyphsize = 20;

  let container; // Reference to the SVG container
  let zoomTransform = { x: 0, y: 0, k: 0.5 }; // Initial zoom state

  $: xScale = scaleLinear().domain([0, size]).range([0, size]);
  $: yScale = scaleLinear().domain([0, size]).range([0, size]);

  $: if ($data.length) {
    // Compute extents
    const xExtent = [
      Math.min(...$data.map((p) => p.x)),
      Math.max(...$data.map((p) => p.x)),
    ];
    const yExtent = [
      Math.min(...$data.map((p) => p.y)),
      Math.max(...$data.map((p) => p.y)),
    ];

    // Create linear scales
    xScale = scaleLinear()
      .domain(xExtent)
      .range([offset, size - offset]);
    yScale = scaleLinear()
      .domain(yExtent)
      .range([offset, size - offset]);
  }

  $: if ($data.length) {
    const allBrightness = $data.map((p) => p.analysis.brightness.mean);
    brightnessExtent = [
      0, //Math.min(...allBrightness),
      Math.max(...allBrightness),
    ];

    const rmsData = $data.map((p) => p.analysis.rms[0]);
    const allRMSextent = rmsData.flat(2);
    rmsExtent = [
      0, //Math.min(...allBrightness),
      Math.max(...allRMSextent),
    ];
  }

  onMount(() => {
    const svg = select(container);

    const zoomBehavior = zoom()
      .scaleExtent([0.25, 5]) // Zoom limits
      .on("zoom", (event) => {
        if (event.sourceEvent.altKey) zoomTransform = event.transform; // Update the transform state
      });

    svg.call(zoomBehavior);
  });
</script>

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
      {#each $data as point, index}
        {#if point === selectedPoint && pointRenderer === "circle"}
          <rect
            x={xScale(point.x) - 5}
            y={yScale(point.y) - 5}
            width={glyphsize / 2}
            height={glyphsize / 2}
            class="point"
            fill={getColor(point, brightnessExtent, pointColor)}
            on:click={() => handleClick(point)}
          ></rect>;
        {:else if pointRenderer === "circle"}
          <circle
            cx={xScale(point.x)}
            cy={yScale(point.y)}
            r={glyphsize / 4}
            class="point"
            fill={getColor(point, brightnessExtent, pointColor)}
            on:click={() => handleClick(point)}
          ></circle>
        {:else if pointRenderer === "glyph"}
          <EnvelopeSimpleGlyph
            data={point.analysis.rms[0]}
            x={xScale(point.x) - 10}
            y={yScale(point.y) - 10}
            width={glyphsize}
            height={glyphsize}
            fill={getColor(point, brightnessExtent, pointColor)}
            onClick={() => handleClick(point)}
            selected={point === selectedPoint}
            extent={rmsExtent}
          />
        {:else if pointRenderer === "brightness"}
          <BrightnessGlyph
            data={point.analysis.centroid[0]}
            x={xScale(point.x) - 10}
            y={yScale(point.y) - 10}
            width={glyphsize}
            height={glyphsize}
            fill={getColor(point, brightnessExtent, pointColor)}
            onClick={() => handleClick(point)}
            selected={point === selectedPoint}
          />
        {:else if pointRenderer === "config"}
          <ConfigMatrixGlyph
            config={point.config}
            x={xScale(point.x) - 10}
            y={yScale(point.y) - 10}
            cellSize={glyphsize / 5}
            onClick={() => handleClick(point)}
            parameters={Object.entries(dx7Parameters)}
            selection={point === selectedPoint ? null : selectedPoint}
          />
        {/if}
      {/each}
    </g>
  </svg>
</div>

<style>
  .map-container {
    margin: 0 auto;
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
