<script>
    import { onMount } from "svelte";
    import * as Plot from "@observablehq/plot";
    import { extent } from "d3-array";
  
    export let selectedPoint = null
  
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
          Plot.line(selectedPoint?.config.map((v, i) => ({ x: i, y: v })), {
            x: "x",
            y: "y",
          }),
        ],
        height: 120,
        width: 350,
        margin: 2,
      });
  
      arrayPlot.innerHTML = "";
      arrayPlot.appendChild(plot);
    };

    const renderCentroidPlot = () => {
      if (!selectedPoint ) return;
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
          Plot.line(selectedPoint?.analysis.centroid[0].map((v, i) => ({ x: i, y: v })), {
            x: "x",
            y: "y",
          }),
        ],
        height: 120,
        width: 350,
        margin: 2,
      });
  
      centroidPlot.innerHTML = "";
      centroidPlot.appendChild(plot);
    };

    const renderRMSPlot = () => {
      if (!selectedPoint ) return;
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
          Plot.line(selectedPoint?.analysis.rms[0].map((v, i) => ({ x: i, y: v })), {
            x: "x",
            y: "y",
          }),
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
            Plot.line(selectedPoint.analysis.hrps.harmonic.map((v, i) => ({ x: i, y: v })), {
                x: "x",
                y: "y",
                stroke: "blue",  // Blue color for the first line
                strokeWidth: 2,
            }),
            // Line for config2
            Plot.line(selectedPoint.analysis.hrps.residual.map((v, i) => ({ x: i, y: v })), {
                x: "x",
                y: "y",
                stroke: "orange",  // Red color for the second line
                strokeWidth: 2,
            }),
            // Line for config3
            Plot.line(selectedPoint.analysis.hrps.percussive.map((v, i) => ({ x: i, y: v })), {
                x: "x",
                y: "y",
                stroke: "red",  // Green color for the third line
                strokeWidth: 2,
            }),
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
        
      if (!selectedPoint || !selectedPoint?.analysis.mfcc) return;
      if (!matrixPlot) return;

        let data = selectedPoint?.analysis.mfcc.flatMap((row, y) =>
              row.map((z, x) => ({ x, y, z }))
            )
        const zExtent = extent(data, d => d.z);

      const plot = Plot.plot({
        marks: [
          Plot.rect(
            data,
            { x: "x", y: "y", fill: "z" }
          ),
        ],
        color: {
            type: "linear",
            domain: [0,zExtent[1]],
            scheme: "viridis",
            range:[0,1]
        },
        x: {
            axis: false, // Remove axis ticks and labels
            ticks: 0,
            label: "", // Remove x-axis label
        },
        y: {
            axis: false, // Remove axis ticks and labels
            ticks: 0,
            label: "", // Remove y-axis label
        },
        height: 120,
        width: 350,
        margin: 2,
      });
  
      matrixPlot.innerHTML = "";
      matrixPlot.appendChild(plot);
    };
  
    // Watch for changes in selectedPoint and update the plots
    $: if (selectedPoint) {
      renderArrayPlot();
      renderMatrixPlot();
      renderHarmonicPlot();
      renderCentroidPlot();
      renderRMSPlot()
    }
  </script>
  
  <style>
    .detail-container {
      border: 1px solid #ccc;
      display: flex;
      flex-direction: column;
      gap:5px;
      padding: 5px;
      width: 400px;
      height: 900px;
      overflow-y: auto;
      background: #696969;
      box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    }
  
    .label {
      font-size: 1rem;
      font-weight: bold;
      margin-bottom: 2px;
    }

    h5 {
        margin: 5px
    }
  
    .plot {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      
    }
  </style>
  
  <div class="detail-container">
    {#if selectedPoint}
      <div class="label">
        Label: {selectedPoint.label}
      </div>
  
      <div class="plot">
        <h5>Config:</h5>
        <div bind:this={arrayPlot}></div>
      </div>
  
      <div class="plot">
        <h5>MFCC:</h5>
        <div bind:this={matrixPlot}></div>
      </div>

      <div class="plot">
        <h5>Harmonics:</h5>
        <div bind:this={harmonicPlot}></div>
      </div>

      <div class="plot">
        <h5>Centroid:</h5>
        <div bind:this={centroidPlot}></div>
      </div>

      <div class="plot">
        <h5>RMS:</h5>
        <div bind:this={rmsPlot}></div>
      </div>
    {:else}
      <div class="label">No point selected</div>
    {/if}
  </div>