<script>
  import { onMount } from "svelte";
  import { scaleLinear, zoom, select } from "d3";
  import { getColor } from "../utils/color";
  import EnvelopeGlyph from "../glyphs/envelopeGlyph.svelte";
  import EnvelopeSimpleGlyph from "../glyphs/envelopeSimpleGlyph.svelte";
  import BrightnessGlyph from "../glyphs/brightnessGlyph.svelte";
  import { createSysexMessageFromConfig, dx7Parameters } from "../utils/dexed";
  import ConfigMatrixGlyph from "../glyphs/configMatrixGlyph.svelte";
  import { data } from "../utils/stores";
  import { interpolate } from "../utils/sampling";
  import { sendMessage } from "../utils/midi";

  export let onPointClick;
  export let pointRenderer = null;
  export let pointColor = null;
  export let selectedPoint = null;
  export let referencePoint = null;

  function handleClick(e, point) {
    if (onPointClick) {
      onPointClick(e, point);
    }
  }

  let interpolationValue = 0.5;

  let brightnessExtent = [Infinity, -Infinity];
  let rmsExtent = [Infinity, -Infinity];

  let interpolateConfig = null;

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

  $: if (referencePoint) {
    drawConnection;
  } else {
    removeConnection;
  }

  function drawConnection() {
    if (!selectedPoint || !referencePoint) return;

    // Create a draggable handle at the midpoint
    let midX = (xScale(selectedPoint.x) + xScale(referencePoint.x)) / 2;
    let midY = (yScale(selectedPoint.y) + yScale(referencePoint.y)) / 2;

    let handle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    handle.setAttribute("cx", midX);
    handle.setAttribute("cy", midY);
    handle.setAttribute("r", 5);
    handle.setAttribute("fill", "red");
    handle.classList.add("draggable-handle");
    handle.onmousedown = startDrag;

    let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", xScale(selectedPoint.x));
    line.setAttribute("y1", yScale(selectedPoint.y));
    line.setAttribute("x2", xScale(referencePoint.x));
    line.setAttribute("y2", yScale(referencePoint.y));
    line.setAttribute("stroke", "black");
    line.classList.add("connection-line");

    let svg = document.querySelector("svg"); // Adjust this to your SVG container
    svg.appendChild(line);
    svg.appendChild(handle);
  }

  function startDrag(event) {
    let handle = event.target;

    function onMouseMove(e) {
      let x1 = xScale(selectedPoint.x);
      let y1 = yScale(selectedPoint.y);
      let x2 = xScale(referencePoint.x);
      let y2 = yScale(referencePoint.y);

      // Get relative mouse position along the line
      let dx = x2 - x1;
      let dy = y2 - y1;
      let length = Math.sqrt(dx * dx + dy * dy);
      let t =
        ((e.clientX - x1) * dx + (e.clientY - y1) * dy) / (length * length);

      interpolationValue = Math.max(0, Math.min(1, t)); // Keep value between 0 and 1
      interpolateConfig = interpolate(
        selectedPoint.config,
        referencePoint.config,
        interpolationValue,
      );

      sendMessage(createSysexMessageFromConfig(interpolateConfig));

      // Move handle
      handle.setAttribute("cx", x1 + interpolationValue * dx);
      handle.setAttribute("cy", y1 + interpolationValue * dy);
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  function removeConnection() {
    document
      .querySelectorAll(".connection-line, .draggable-handle")
      .forEach((el) => el.remove());
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
        {#if point.sampled}
          {#if point === selectedPoint && pointRenderer === "circle"}
            <rect
              x={xScale(point.x) - 5}
              y={yScale(point.y) - 5}
              width={glyphsize / 2}
              height={glyphsize / 2}
              class="point"
              fill={getColor(point, brightnessExtent, pointColor)}
              on:click={(e) => handleClick(e, point)}
            ></rect>;
          {:else if pointRenderer === "circle"}
            <circle
              cx={xScale(point.x)}
              cy={yScale(point.y)}
              r={glyphsize / 4}
              class="point"
              fill={getColor(point, brightnessExtent, pointColor)}
              on:click={(e) => handleClick(e, point)}
            ></circle>
          {:else if pointRenderer === "glyph"}
            <EnvelopeSimpleGlyph
              data={point.analysis.rms[0]}
              x={xScale(point.x) - 10}
              y={yScale(point.y) - 10}
              width={glyphsize}
              height={glyphsize}
              fill={getColor(point, brightnessExtent, pointColor)}
              onClick={(e) => handleClick(e, point)}
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
              onClick={(e) => handleClick(e, point)}
              selected={point === selectedPoint}
            />
          {:else if pointRenderer === "config"}
            <ConfigMatrixGlyph
              config={point.config}
              x={xScale(point.x) - 10}
              y={yScale(point.y) - 10}
              cellSize={glyphsize / 5}
              onClick={(e) => handleClick(e, point)}
              parameters={Object.entries(dx7Parameters)}
              selection={point === selectedPoint ? null : selectedPoint}
            />
          {/if}
        {:else}
          <Reference
              data={point.label}
              x={xScale(point.x) - 10}
              y={yScale(point.y) - 10}
              width={glyphsize}
              height={glyphsize}
              fill={getColor(point, brightnessExtent, pointColor)}
              onClick={(e) => handleClick(e, point)}
              selected={point === selectedPoint}
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
