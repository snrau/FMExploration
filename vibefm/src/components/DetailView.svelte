<script>
  import { onMount } from "svelte";
  import * as Plot from "@observablehq/plot";
  import { extent } from "d3-array";
  import { playWav } from "../utils/midi";
  import Algorithm from "./Algorithm.svelte";
  import { exportList, startingIndex } from "../utils/stores";
  import { getNamefromConfig } from "../utils/sysex";
  import { progressiveSubgroupBlockSampling } from "../utils/strategies";
  import { sendReaper } from "../utils/serverRequests";

  export let selectedPoint = null;

  let textInput = "";

  // sample tree structure
  const handleButtonClick1 = () => {
    console.log(selectedPoint);
    // sample new list of config
    const config = selectedPoint.config;
    const newConfigs = progressiveSubgroupBlockSampling(config, 20, false);
    // do analysis on this configs (only on these so new request)
    sendReaper(newConfigs);
    // write json with connections {selectedpoint.filename: [newname, ...], ...} (newname is 'patch_' + (startindex + i))
    writeEdges(selectedPoint, newConfigs, $startingIndex);
  };

  const handleButtonClick2 = () => {
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

  // Function to render the 2D array plot
  const renderMatrixPlot = () => {
    if (!selectedPoint || !selectedPoint?.label) return;
    if (!matrixPlot) return;

    const imageUrl = `./output/${selectedPoint.label}_mel.png`;
    const img = new Image();
    img.src = imageUrl;
    img.alt = "MFCC Image for " + selectedPoint.label;

    img.style.objectFit = "contain";
    img.style.width = "100%";
    img.style.height = "100%";

    img.onload = () => {
      matrixPlot.innerHTML = "";
      matrixPlot.appendChild(img);
    };
  };

  // Watch for changes in selectedPoint and update the plots
  $: if (selectedPoint) {
    textInput = getNamefromConfig(selectedPoint.config);
    renderArrayPlot();
    renderMatrixPlot();
    renderHarmonicPlot();
    renderCentroidPlot();
    renderRMSPlot();
  }
</script>

<div class="menu">
  <button on:click={handleButtonClick1}>Sample similar</button>
  <button on:click={handleButtonClick2}>add to Export list</button>
  <input
    type="text"
    bind:value={textInput}
    maxlength="10"
    placeholder="Config Name"
  />
</div>

<div class="detail-container">
  {#if selectedPoint}
    <div class="label">
      Label: {selectedPoint.label}
    </div>
    <button class="label" on:click={() => playWav(selectedPoint)}>
      Play Wav</button
    >

    <div class="plot">
      <h5>Config:</h5>
      <Algorithm
        algorithm={selectedPoint.config[134]}
        config={selectedPoint.config}
      ></Algorithm>
      <!--<div class="plotcontainer" bind:this={arrayPlot}></div>-->
    </div>

    <div class="plot">
      <h5>Mel-Spectogram:</h5>
      <div class="plotcontainer" bind:this={matrixPlot}></div>
    </div>

    <div class="plot">
      <h5>Harmonics:</h5>
      <div class="plotcontainer" bind:this={harmonicPlot}></div>
    </div>

    <div class="plot">
      <h5>Centroid:</h5>
      <div class="plotcontainer" bind:this={centroidPlot}></div>
    </div>

    <div class="plot">
      <h5>RMS:</h5>
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
    width: 400px;
    height: 900px;
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

  h5 {
    margin: 5px;
  }

  .plot {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .plotcontainer {
    width: 350px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  img {
    max-width: 100%;
    max-height: 100%;
  }

  .menu {
    border: 1px solid #ccc;
    width: 400px;
    display: flex;
    margin: 5 0px;
    border-bottom: 1px solid #ccc;
    border: 1px solid #ccc;
    display: flex;
    gap: 5px;
    padding: 5px;
    width: 400px;
    background: #ffffff;
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    color: black;
  }

  .menu button {
    margin: 2px;
    padding: 5px 10px;
    border: none;
    background: #007bff;
    color: white;
    cursor: pointer;
    border-radius: 4px;
  }

  .menu button:hover {
    background: #0056b3;
  }

  .menu input {
    margin: 2px;
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 120px;
  }
</style>
