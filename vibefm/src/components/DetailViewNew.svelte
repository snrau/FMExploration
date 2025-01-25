let arrayPlot, centroidPlot, rmsPlot, harmonicPlot, matrixPlot;

  // Helper to update a plot
  function updatePlot(container, newData, options = {}) {
    if (!container) return;

    const plot = Plot.plot({
      ...options,
      marks: [Plot.line(newData, { x: "x", y: "y", ...options.lineOptions })],
    });

    container.innerHTML = "";
    container.appendChild(plot);
  }

  // Function to render harmonic plot with multiple lines
  function updateHarmonicPlot() {
    if (!harmonicPlot || !selectedPoint) return;

    const marks = [
      Plot.line(
        selectedPoint.analysis.hrps.harmonic.map((v, i) => ({ x: i, y: v })),
        { stroke: "blue", strokeWidth: 2 },
      ),
      Plot.line(
        selectedPoint.analysis.hrps.residual.map((v, i) => ({ x: i, y: v })),
        { stroke: "orange", strokeWidth: 2 },
      ),
      Plot.line(
        selectedPoint.analysis.hrps.percussive.map((v, i) => ({ x: i, y: v })),
        { stroke: "red", strokeWidth: 2 },
      ),
    ];

    const plot = Plot.plot({
      marks,
      height: 120,
      width: 350,
      x: { ticks: 0, label: "" },
      y: { ticks: 0, label: "" },
    });

    harmonicPlot.innerHTML = "";
    harmonicPlot.appendChild(plot);
  }

  // Function to update the matrix plot
  function updateMatrixPlot() {
    if (!matrixPlot || !selectedPoint) return;

    const data = selectedPoint.analysis.mfcc.flatMap((row, y) =>
      row.map((z, x) => ({ x, y, z })),
    );
    const zExtent = extent(data, (d) => d.z);

    const plot = Plot.plot({
      marks: [Plot.rect(data, { x: "x", y: "y", fill: "z" })],
      color: {
        type: "linear",
        domain: [zExtent[0], zExtent[1]],
        scheme: "viridis",
      },
      height: 120,
      width: 350,
      x: { axis: false },
      y: { axis: false },
    });

    matrixPlot.innerHTML = "";
    matrixPlot.appendChild(plot);
  }

  // Update plots reactively
  $: {
    if (selectedPoint) {
      // Update each plot with new data
      updatePlot(
        arrayPlot,
        selectedPoint.config.map((v, i) => ({ x: i, y: v })),
        { height: 120, width: 350 },
      );

      updatePlot(
        centroidPlot,
        selectedPoint.analysis.centroid[0].map((v, i) => ({ x: i, y: v })),
        { height: 120, width: 350 },
      );

      updatePlot(
        rmsPlot,
        selectedPoint.analysis.rms[0].map((v, i) => ({ x: i, y: v })),
        { height: 120, width: 350 },
      );

      updateHarmonicPlot();
      updateMatrixPlot();
    }
  }
</script>

<div>
  <div bind:this={arrayPlot}></div>
  <div bind:this={centroidPlot}></div>
  <div bind:this={rmsPlot}></div>
  <div bind:this={harmonicPlot}></div>
  <div bind:this={matrixPlot}></div>
</div>