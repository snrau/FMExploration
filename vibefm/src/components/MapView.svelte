<script>
  import { onMount } from "svelte";
  import { scaleLinear, zoom, select, drag, brush } from "d3";
  import { getColor } from "../utils/color";
  import EnvelopeGlyph from "../glyphs/envelopeGlyph.svelte";
  import EnvelopeSimpleGlyph from "../glyphs/envelopeSimpleGlyph.svelte";
  import BrightnessGlyph from "../glyphs/brightnessGlyph.svelte";
  import Reference from "../glyphs/reference.svelte";
  import { createSysexMessageFromConfig, dx7Parameters } from "../utils/dexed";
  import ConfigMatrixGlyph from "../glyphs/configMatrixGlyph.svelte";
  import { data, excluded } from "../utils/stores";
  import { interpolate } from "../utils/sampling";
  import { sendMessage } from "../utils/midi";
  import { interpolatedConfig } from "../utils/stores";

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

  function handleSvgClick(event) {
    // Check if Alt or Ctrl is pressed
    if (event.altKey || event.ctrlKey) return;

    // Check if the clicked target is NOT a point
    if (event.target.id === "full-svg") {
      onPointClick(event, null);
    }
  }

  let interpolationValue = 0.5;

  let brightnessExtent = [Infinity, -Infinity];
  let rmsExtent = [Infinity, -Infinity];

  let interpolateConfig = null;

  let pointsToRemove = [];

  let recentConfig = null;

  let isBrushing = false;

  const size = 2000;
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

  $: referencePoint, change(referencePoint);

  function change(referencePoint) {
    if (referencePoint) {
      removeConnection();
      drawConnection();
    } else {
      removeConnection();
    }
  }

  function drawConnection() {
    if (!selectedPoint || !referencePoint) return;

    let g = select("#map").append("g").attr("id", "interpolation"); // Adjust this to your SVG container
    g.append("line")
      .attr("x1", xScale(selectedPoint.x))
      .attr("y1", yScale(selectedPoint.y))
      .attr("x2", xScale(referencePoint.x))
      .attr("y2", yScale(referencePoint.y))
      .attr("stroke", "black")
      .classed("connection-line", true);

    g.append("circle")
      .attr("cx", (xScale(selectedPoint.x) + xScale(referencePoint.x)) / 2)
      .attr("cy", (yScale(selectedPoint.y) + yScale(referencePoint.y)) / 2)
      .attr("r", 5)
      .attr("fill", "green")
      .classed("draggable-handle", true)
      .call(
        drag()
          .on("start", (e) => {})
          .on("drag", dragged)
          .on("end", (e) => {}),
      );
  }

  let aAlgo = true;

  function dragged(e) {
    if (!e) return;
    let x1 = xScale(selectedPoint.x);
    let y1 = yScale(selectedPoint.y);
    let x2 = xScale(referencePoint.x);
    let y2 = yScale(referencePoint.y);

    // Get relative mouse position along the line
    let dx = x2 - x1;
    let dy = y2 - y1;
    let length = Math.sqrt(dx * dx + dy * dy);
    let t = ((e.x - x1) * dx + (e.y - y1) * dy) / (length * length);

    interpolationValue = Math.max(0, Math.min(1, t)); // Keep value between 0 and 1
    if (interpolationValue === 1) {
      aAlgo = false;
    } else if (interpolationValue === 0) {
      aAlgo = true;
    }
    interpolateConfig = interpolate(
      selectedPoint.config,
      referencePoint.config,
      interpolationValue,
      aAlgo,
    );
    if (recentConfig !== interpolateConfig) {
      sendMessage(createSysexMessageFromConfig(interpolateConfig));
      interpolatedConfig.set(interpolateConfig);
    }

    // Move handle
    select(this)
      .attr("cx", x1 + interpolationValue * dx)
      .attr("cy", y1 + interpolationValue * dy)
      .attr("fill", aAlgo ? "green" : "yellow");
  }

  function removeConnection() {
    recentConfig = null;
    select("#interpolation").selectAll("*").remove();
  }

  function exclude(selectedPoint) {
    excluded.set([...$excluded, ...selectedPoint]);
  }

  onMount(() => {
    const svg = select(container);

    const zoomBehavior = zoom()
      .scaleExtent([0.25, 5]) // Zoom limits
      .on("zoom", (event) => {
        if (event.sourceEvent.altKey) {
          zoomTransform = event.transform; // Update the transform state
        }
      });

    //svg.call(zoomBehavior.transform, zoomTransform);

    svg.call(zoomBehavior);

    const brushBehavior = brush().on("end", (event) => {
      if (!event.selection) return;

      const [[x0, y0], [x1, y1]] = event.selection;

      // Assuming you have a way to get all points, e.g., from a data array
      // Replace `allPoints` with your actual data points array
      $data.forEach((point) => {
        let transformedPoint = [xScale(point.x) / 2, yScale(point.y) / 2];
        if (zoomTransform.apply) {
          const transformedPoint = zoomTransform.apply([
            xScale(point.x),
            yScale(point.y),
          ]);
        }
        if (
          transformedPoint[0] >= x0 &&
          transformedPoint[0] <= x1 &&
          transformedPoint[1] >= y0 &&
          transformedPoint[1] <= y1
        ) {
          pointsToRemove.push(point.id);
        }
      });
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "b" && !isBrushing) {
        pointsToRemove = [];
        isBrushing = true;
        svg.append("g").attr("id", "brushcontainer").call(brushBehavior);
        svg.style("cursor", "default");
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.key === "b") {
        if (pointsToRemove.length > 0) exclude(pointsToRemove);
        isBrushing = false;
        svg.select("#brushcontainer").remove(); // Remove brush behavior

        svg.style("cursor", "default");
      }
    });
  });
</script>

<div class="map-container" style="width: {size}px; height: {size}px;">
  <svg
    bind:this={container}
    width={size}
    height={size}
    on:click={handleSvgClick}
    id={"full-svg"}
  >
    <g
      id={"map"}
      transform="translate({zoomTransform.x},{zoomTransform.y}) scale({zoomTransform.k})"
    >
      <!--{#if pointRenderer === "rect"}-->
      {#each $data as point, index}
        {#if point.analysis.sampled}
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
          {:else if pointRenderer === "envelope"}
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
        {:else if point.analysis.sysex || point.analysis.reference}
          <Reference
            data={point}
            x={xScale(point.x) - 10}
            y={yScale(point.y) - 10}
            class1="point"
            fill={getColor(point, brightnessExtent, pointColor)}
            onClick={(e) => handleClick(e, point)}
            selected={point === selectedPoint}
            {pointRenderer}
            {selectedPoint}
            interpolation={false}
          ></Reference>
        {:else}
          <Reference
            data={point}
            x={xScale(point.x) - 10}
            y={yScale(point.y) - 10}
            class1="point"
            fill={getColor(point, brightnessExtent, pointColor)}
            onClick={(e) => handleClick(e, point)}
            selected={point === selectedPoint}
            {pointRenderer}
            {selectedPoint}
            interpolation={true}
          ></Reference>
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
