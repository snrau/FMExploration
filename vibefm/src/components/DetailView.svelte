<script>
  import { onMount } from "svelte";
  import * as Plot from "@observablehq/plot";
  import { extent } from "d3-array";
  import { playWav } from "../utils/midi";
  import Algorithm from "./Algorithm.svelte";
  import {
    excluded,
    exportList,
    startingIndex,
    updateView,
    numSamples,
  } from "../utils/stores";
  import { getNamefromConfig } from "../utils/sysex";
  import {
    progressiveSubgroupBlockSampling,
    sampleAllValues,
    sampleSingleValues,
  } from "../utils/strategies";
  import { sendReaper, writeEdges } from "../utils/serverRequests";
  import * as d3 from "d3";

  export let selectedPoint = null;

  let isSingle = true;
  let isSmall = true;
  let textInput = "";

  // sample tree structure
  const handleButtonClick1 = () => {
    if (!selectedPoint?.config) {
      return;
    }
    // sample new list of config
    const config = selectedPoint.config;

    const percent = isSmall ? 5 : 100;

    let newConfigs = [];
    //isSingle and isSmall for the 4 sampling ideas
    if (isSingle) {
      newConfigs = sampleSingleValues(config, percent);
    } else {
      newConfigs = sampleAllValues(config, percent, $numSamples);
    }

    //const newConfigs = progressiveSubgroupBlockSampling(config, 20, false);
    // do analysis on this configs (only on these so new request)
    sendReaper(newConfigs).then((res) => {
      updateView.set(!updateView);
    });
    // write json with connections {selectedpoint.filename: [newname, ...], ...} (newname is 'patch_' + (startindex + i))
    writeEdges(selectedPoint, newConfigs, $startingIndex);
  };

  const handleButtonClick2 = () => {
    if (!selectedPoint?.config) {
      return;
    }
    if (selectedPoint) {
      let temp = selectedPoint.config;

      for (let i = 0; i < 10; i++) {
        temp[145 + i] = textInput.charCodeAt(i) || 32;
      }
      selectedPoint.config = temp;
      exportList.update((list) => {
        const tempConfigHead = temp.slice(0, 145); // Extract first 145 values

        // Find index of an existing entry with the same first 145 elements
        const existingIndex = list.findIndex((item) =>
          item.slice(0, 145).every((val, i) => val === tempConfigHead[i]),
        );

        if (existingIndex !== -1) {
          // Replace existing entry
          const newList = [...list];
          newList[existingIndex] = temp;
          return newList;
        } else {
          // Add new entry
          return [...list, temp];
        }
      });
      console.log("Added to export list: ", selectedPoint.label);
    }
  };

  let arrayPlot; // Reference for the 1D array plot
  let matrixPlot; // Reference for the 2D array plot
  let harmonicPlot; // Reference for the 2D array plot
  let centroidPlot; // Reference for the 2D array plot
  let rmsPlot; // Reference for the 2D array plot

  const renderArrayPlot = () => {
    if (!selectedPoint || !selectedPoint?.config) return;
    if (!arrayPlot) return;

    const data = selectedPoint.config.map((v, i) => ({ x: i, y: v }));

    const svg = d3
      .select(arrayPlot)
      .html("")
      .append("svg")
      .attr("width", 350)
      .attr("height", 120)
      .append("g")
      .attr("transform", "translate(2,2)");

    const x = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([0, 346]);
    const y = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d.y), d3.max(data, (d) => d.y)])
      .range([118, 0]);

    const line = d3
      .line()
      .x((d) => x(d.x))
      .y((d) => y(d.y));

    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .attr("d", line);
  };

  const renderCentroidPlot = () => {
    if (!selectedPoint) return;
    if (!centroidPlot) return;

    const data = selectedPoint.analysis.centroid[0].map((v, i) => ({
      x: i,
      y: v,
    }));

    const svg = d3
      .select(centroidPlot)
      .html("")
      .append("svg")
      .attr("width", 350)
      .attr("height", 120)
      .append("g")
      .attr("transform", "translate(2,2)");

    const x = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([20, 346]);
    const y = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d.y), d3.max(data, (d) => d.y)])
      .range([100, 0]);

    const xAxis = d3
      .axisBottom(x)
      .ticks(0)
      .tickFormat((t) => {
        if (t === 200) return "";
        else return t;
      });
    const yAxis = d3.axisLeft(y).ticks(0);

    const line = d3
      .line()
      .x((d) => x(d.x))
      .y((d) => y(d.y));

    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .attr("d", line);

    svg
      .append("g")
      .attr("transform", "translate(0,100)") // Position x-axis at the bottom
      .call(xAxis);

    svg.append("g").attr("transform", "translate(20,0)").call(yAxis);

    // Add x-axis title
    svg
      .append("text")
      .attr("transform", "translate(150,117)") // Position x-axis title
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("time");

    // Add y-axis title
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -5)
      .attr("x", -50)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("centroid freq.");
  };

  const renderRMSPlot = () => {
    if (!selectedPoint) return;
    if (!rmsPlot) return;

    const data = selectedPoint.analysis.rms[0].map((v, i) => ({ x: i, y: v }));

    const svg = d3
      .select(rmsPlot)
      .html("")
      .append("svg")
      .attr("width", 350)
      .attr("height", 120)
      .append("g")
      .attr("transform", "translate(2,2)");

    const x = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([20, 346]);
    const y = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d.y), d3.max(data, (d) => d.y)])
      .range([100, 0]);

    const xAxis = d3
      .axisBottom(x)
      .ticks(0)
      .tickFormat((t) => {
        if (t === 200) return "";
        else return t;
      });
    const yAxis = d3.axisLeft(y).ticks(0);

    const line = d3
      .line()
      .x((d) => x(d.x))
      .y((d) => y(d.y));

    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .attr("d", line);

    svg
      .append("g")
      .attr("transform", "translate(0,100)") // Position x-axis at the bottom
      .call(xAxis);

    svg.append("g").attr("transform", "translate(20,0)").call(yAxis);

    // Add x-axis title
    svg
      .append("text")
      .attr("transform", "translate(150,117)") // Position x-axis title
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("time");

    // Add y-axis title
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -5)
      .attr("x", -50)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("rms-energy");
  };

  const renderHarmonicPlot = () => {
    if (!selectedPoint) return;
    if (!harmonicPlot) return;

    const harmonicData = selectedPoint.analysis.hrps.harmonic.map((v, i) => ({
      x: i,
      y: v,
    }));
    const residualData = selectedPoint.analysis.hrps.residual.map((v, i) => ({
      x: i,
      y: v,
    }));
    const percussiveData = selectedPoint.analysis.hrps.percussive.map(
      (v, i) => ({ x: i, y: v }),
    );

    const svg = d3
      .select(harmonicPlot)
      .html("")
      .append("svg")
      .attr("width", 350)
      .attr("height", 120)
      .append("g")
      .attr("transform", "translate(2,2)");

    const x = d3
      .scaleLinear()
      .domain([0, harmonicData.length - 1])
      .range([0, 346]);
    const y = d3
      .scaleLinear()
      .domain([
        d3.min(
          harmonicData.concat(residualData).concat(percussiveData),
          (d) => d.y,
        ),
        d3.max(
          harmonicData.concat(residualData).concat(percussiveData),
          (d) => d.y,
        ),
      ])
      .range([100, 0]);

    const xAxis = d3
      .axisBottom(x)
      .ticks(0)
      .tickFormat((t) => {
        if (t / 500 === 200) return "";
        else return t / 500;
      });
    svg
      .append("g")
      .attr("transform", "translate(0,100)") // Position x-axis at the bottom
      .call(xAxis);

    const line = d3
      .line()
      .x((d) => x(d.x))
      .y((d) => y(d.y));

    svg
      .append("path")
      .datum(harmonicData)
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("stroke-width", 2)
      .attr("d", line);

    svg
      .append("path")
      .datum(residualData)
      .attr("fill", "none")
      .attr("stroke", "orange")
      .attr("stroke-width", 2)
      .attr("d", line);

    svg
      .append("path")
      .datum(percussiveData)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add x-axis title
    svg
      .append("text")
      .attr("transform", "translate(150,117)") // Position x-axis title
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("time");
  };

  /*
  // Function to render the 1D array plot
  const renderArrayPlot = () => {
    if (!selectedPoint || !selectedPoint?.config) return;
    if (!arrayPlot) return;

    const plot = Plot.plot({
      x: {
        ticks: 0, // Remove axis ticks and labels
        label: "", // Remove x-axis label
      },
      y: {
        ticks: 0, // Remove axis ticks and labels
        label: "", // Remove y-axis label
      },
      marks: [
        Plot.line(
          selectedPoint?.config.map((v, i) => ({ x: i, y: v })),
          {
            x: "x",
            y: "y",
          },
        ),
      ],
      height: 120,
      width: 350,
      margin: 2,
    });

    arrayPlot.innerHTML = "";
    arrayPlot.appendChild(plot);
  };

  const renderCentroidPlot = () => {
    if (!selectedPoint) return;
    if (!centroidPlot) return;

    const plot = Plot.plot({
      x: {
        ticks: 0, // Remove axis ticks and labels
        label: "", // Remove x-axis label
      },
      y: {
        ticks: 0, // Remove axis ticks and labels
        label: "", // Remove y-axis label
      },
      marks: [
        Plot.line(
          selectedPoint?.analysis.centroid[0].map((v, i) => ({ x: i, y: v })),
          {
            x: "x",
            y: "y",
          },
        ),
      ],
      height: 120,
      width: 350,
      margin: 2,
    });

    centroidPlot.innerHTML = "";
    centroidPlot.appendChild(plot);
  };

  const renderRMSPlot = () => {
    if (!selectedPoint) return;
    if (!rmsPlot) return;

    const plot = Plot.plot({
      x: {
        ticks: 0, // Remove axis ticks and labels
        label: "", // Remove x-axis label
      },
      y: {
        ticks: 0, // Remove axis ticks and labels
        label: "", // Remove y-axis label
      },
      marks: [
        Plot.line(
          selectedPoint?.analysis.rms[0].map((v, i) => ({ x: i, y: v })),
          {
            x: "x",
            y: "y",
          },
        ),
      ],
      height: 120,
      width: 350,
      margin: 2,
    });

    rmsPlot.innerHTML = "";
    rmsPlot.appendChild(plot);
  };

  const renderHarmonicPlot = () => {
    if (!selectedPoint) return;
    if (!harmonicPlot) return;

    const plot = Plot.plot({
      x: {
        ticks: 0, // Remove axis ticks and labels
        label: "", // Remove x-axis label
      },
      y: {
        ticks: 0, // Remove axis ticks and labels
        label: "", // Remove y-axis label
      },
      marks: [
        Plot.line(
          selectedPoint.analysis.hrps.harmonic.map((v, i) => ({ x: i, y: v })),
          {
            x: "x",
            y: "y",
            stroke: "blue", // Blue color for the first line
            strokeWidth: 2,
          },
        ),
        // Line for config2
        Plot.line(
          selectedPoint.analysis.hrps.residual.map((v, i) => ({ x: i, y: v })),
          {
            x: "x",
            y: "y",
            stroke: "orange", // Red color for the second line
            strokeWidth: 2,
          },
        ),
        // Line for config3
        Plot.line(
          selectedPoint.analysis.hrps.percussive.map((v, i) => ({
            x: i,
            y: v,
          })),
          {
            x: "x",
            y: "y",
            stroke: "red", // Green color for the third line
            strokeWidth: 2,
          },
        ),
      ],
      height: 120,
      width: 350,
      margin: 2,
    });

    harmonicPlot.innerHTML = "";
    harmonicPlot.appendChild(plot);
  };
  */

  // Function to render the 2D array plot
  const renderMatrixPlot = () => {
    if (!selectedPoint || !selectedPoint?.label) return;
    if (!matrixPlot) return;

    const folder = selectedPoint.analysis.sampled ? "sampled" : "reference";
    const imageUrl = `./${folder}/${selectedPoint.label}_mel.png`;
    const img = new Image();
    img.src = imageUrl;
    img.alt = "MFCC Image for " + selectedPoint.label;

    img.style.objectFit = "contain";
    img.style.width = "100%";
    img.style.height = "100%";

    img.onload = () => {
      if (!matrixPlot) return;

      matrixPlot.innerHTML = "";
      matrixPlot.appendChild(img);
    };
  };

  function exclude(selectedPoint) {
    excluded.set([...$excluded, selectedPoint.id]);
  }

  // Watch for changes in selectedPoint and update the plots
  $: if (selectedPoint) {
    if (selectedPoint?.config) {
      textInput = getNamefromConfig(selectedPoint.config);
    }
    renderArrayPlot();
    renderMatrixPlot();
    renderHarmonicPlot();
    renderCentroidPlot();
    renderRMSPlot();
  }

  onMount(() => {
    if (selectedPoint) {
      renderArrayPlot();
      renderMatrixPlot();
      renderHarmonicPlot();
      renderCentroidPlot();
      renderRMSPlot();
    }
  });
</script>

<!-- Menu Inner Content (no outer card) -->
<div class="flex flex-col sm:flex-row justify-between items-start gap-6 w-full">
  <!-- Left: Toggles -->
  <div class="flex flex-col gap-4 w-full sm:max-w-[40%]">
    <div class="form-control items-center justify-center w-full max-w-xs">
      <label class="label mb-1 justify-center">
        <span class="label-text text-sm font-semibold text-center">Mode</span>
      </label>
      <div class="flex items-center justify-center gap-3">
        <span class="text-sm">All</span>
        <input
          type="checkbox"
          bind:checked={isSingle}
          class="toggle toggle-sm toggle-primary"
        />
        <span class="text-sm">Single</span>
      </div>
    </div>

    <!-- Toggle 2 -->
    <div class="form-control w-full items-center justify-center max-w-xs">
      <label class="label mb-1 justify-center">
        <span class="label-text text-sm font-medium">Size</span>
      </label>
      <div class="flex items-center justify-center gap-3">
        <span class="text-sm">Large</span>
        <input
          type="checkbox"
          bind:checked={isSmall}
          class="toggle toggle-sm toggle-primary"
        />
        <span class="text-sm">Small</span>
      </div>
    </div>
  </div>

  <!-- Right: Buttons & Input -->
  <div class="flex flex-col gap-4 w-full sm:max-w-[60%]">
    <button
      class="btn text-primary btn-primary btn-sm w-full"
      on:click={handleButtonClick1}
    >
      Sample Similar
    </button>

    <button
      class="btn text-primary btn-primary btn-sm w-full"
      on:click={handleButtonClick2}
    >
      Add to Export List
    </button>
    <input
      type="text"
      bind:value={textInput}
      maxlength="10"
      placeholder="Config Name"
      class="input input-primary input-bordered input-sm mt-2 w-full"
    />
  </div>
</div>
<!--
<div class="menu">
  <div class="left">
    <label class="checkbox-label">
      <input class="checkbox" type="checkbox" bind:checked={isSingle} />
      <span>{isSingle ? "Single" : "All"}</span>
    </label>

    <label class="checkbox-label">
      <input class="checkbox" type="checkbox" bind:checked={isSmall} />
      <span>{isSmall ? "Small" : "Large"}</span>
    </label>
  </div>

  <div class="right">
    <div class="buttons">
      <button class="full-height" on:click={handleButtonClick1}
        >Sample similar</button
      >
      <div class="stacked">
        <button on:click={handleButtonClick2}>Add to Export list</button>
        <input
          type="text"
          bind:value={textInput}
          maxlength="10"
          placeholder="Config Name"
        />
      </div>
    </div>
  </div>
</div>
-->

<div class="detail-container">
  {#if selectedPoint}
    <div class="label">
      Label: {selectedPoint.label}
    </div>
    <div class="button-container">
      <button class="label" on:click={() => playWav(selectedPoint)}>
        Play Wav
      </button>
      <button class="label" on:click={() => exclude(selectedPoint)}>
        Exclude
      </button>
    </div>

    <div class="plot">
      <h5>Config:</h5>
      <Algorithm
        algorithm={selectedPoint?.config ? selectedPoint?.config[134] : 0}
        config={selectedPoint?.config}
      ></Algorithm>
      <!--<div class="plotcontainer" bind:this={arrayPlot}></div>-->
    </div>

    <div class="plot">
      <h5>Mel-Frequency Spectrogram:</h5>
      <div class="plotcontainer" bind:this={matrixPlot}></div>
    </div>

    <div class="plot">
      <h5>Harmonics-Percussive:</h5>
      <div class="plotcontainer" bind:this={harmonicPlot}></div>
    </div>

    <div class="plot">
      <h5>Brightness:</h5>
      <div class="plotcontainer" bind:this={centroidPlot}></div>
    </div>

    <div class="plot">
      <h5>Envelope:</h5>
      <div class="plotcontainer" bind:this={rmsPlot}></div>
    </div>
  {:else}
    <div class="label">No point selected</div>
  {/if}
</div>

<style>
  .detail-container {
    border: 1px solid #ccc;
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 5px;
    width: 500px;
    height: 985px;
    overflow-y: auto;
    background: #ffffff;
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    color: black;
  }

  .label {
    font-size: 1rem;
    font-weight: bold;
    margin-bottom: 2px;
  }

  .left {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.5rem;
  }

  .right {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
  }

  .buttons {
    display: flex;
    gap: 0.5rem;
    height: 100%;
  }

  .full-height {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stacked {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    margin-left: 10px;
  }

  .stacked button,
  .stacked input {
    margin-top: 10px;
    width: 100%;
  }

  h5 {
    margin: 5px;
  }

  .plot {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .checkbox {
    max-width: 50px;
    max-height: 50px;
    gap: 0.5rem;
  }

  .plotcontainer {
    width: 450px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .menu {
    display: grid;
    grid-template-columns: 1fr 3fr;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    border: 1px solid #ccc;
    width: 500px;
    margin: 5 0px;
    border-bottom: 1px solid #ccc;
    border: 1px solid #ccc;
    gap: 5px;
    padding: 5px;
    background: #ffffff;
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    color: black;
  }

  .menu button {
    margin: 2px;
    padding: 5px 10px;
    border: none;
    background: rgb(225, 225, 225);
    color: rgb(0, 0, 0);
    cursor: pointer;
    border-radius: 4px;
  }

  .menu button:hover {
    background: #525252;
    color: white;
  }

  .menu input {
    margin: 2px;
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 120px;
    margin-top: 0.5rem;
  }

  .left label {
    display: flex;
    align-items: baseline;
    gap: -0.5rem;
  }
</style>
