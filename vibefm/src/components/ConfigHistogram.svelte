<script>
    import * as d3 from "d3";
    import { onMount } from "svelte";
    import { cellStateStore } from "../utils/stores";

    export let parameters = []; // { index, change, max }
    export let configs = []; // Array of arrays: configs[row][col] = [values]
    export let cellSize = 30;
    export let binnumber = 10;

    const margin = 25;
    const paddingsvg = 10;

    const rows = 7;
    const cols = 6;
    const padding = 0.5;
    const width = margin + cols * cellSize + paddingsvg;
    const height = margin + rows * cellSize + paddingsvg;
    let svg;
    let intensity = false;

    // Define 6 column colors + 2 additional for the last row
    const colors = d3.schemeTableau10;

    /*
    [
        "#1f77b4",
        "#ff7f0e",
        "#2ca02c",
        "#d62728",
        "#9467bd",
        "#8c564b",
        "#e377c2",
        "#7f7f7f",
    ];
    */

    // Processed data
    $: filteredData = parameters
        .filter((d) => d[1].change === true && d[1].number < 145)
        .map((d, i) => {
            const row =
                Math.floor(i / cols) === 6 ? 6 : 5 - Math.floor(i / cols);
            const col = i % cols;
            const values = configs.map((a) => a[d[1].number]);
            const label = d[0];
            return { row, col, values, max: d[1].max, label };
        });

    function drawMatrix() {
        const svgElement = d3.select(svg);
        svgElement.selectAll("*").remove();

        const cells = svgElement
            .selectAll("g.cell")
            .data(filteredData)
            .join("g")
            .attr("class", "cell")
            .attr(
                "transform",
                (d) =>
                    `translate(${margin + d.col * cellSize}, ${margin + d.row * cellSize})`,
            );

        cells
            .append("rect")
            .attr("width", cellSize - padding)
            .attr("height", cellSize - padding)
            .attr("fill", "white")
            .attr("stroke", "black")
            .attr("stroke-width", 0.1)
            .on("click", function (event, d) {
                const store = {
                    ...$cellStateStore,
                    [d.label]: !$cellStateStore[d.label],
                };
                cellStateStore.set(store); // Update Svelte store
                updateCellVisual(d3.select(this.parentNode), d.label); // Update UI
            });

        // Draw "X" for cells already active in the store
        cells.each(function (d) {
            updateCellVisual(d3.select(this), d.label || false);
        });

        const columnLabels = ["R1", "R2", "R3", "Lvl", "FC", "FF"];
        svgElement
            .selectAll("text.col-label")
            .data(columnLabels)
            .join("text")
            .attr("x", (d, i) => margin + i * cellSize + cellSize / 2)
            .attr("y", margin - 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .text((d) => d);

        const rowLabels = ["OP1", "OP2", "OP3", "OP4", "OP5", "OP6"];
        svgElement
            .selectAll("text.row-label")
            .data(rowLabels)
            .join("text")
            .attr("x", margin - 5)
            .attr("y", (d, i) => margin + i * cellSize + cellSize / 2)
            .attr("text-anchor", "end")
            .attr("font-size", "10px")
            .text((d) => d);

        svgElement
            .append("text")
            .attr("x", margin - 5)
            .attr("y", margin + 6 * cellSize + cellSize / 2)
            .attr("text-anchor", "end")
            .attr("font-size", "10px")
            .text("ALG");

        svgElement
            .append("text")
            .attr("x", margin + 2 * cellSize + cellSize / 2 - padding)
            .attr("y", margin + 6 * cellSize + cellSize / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .text("FB");

        cells.each(function (d) {
            const g = d3.select(this);
            let { values, max } = d;

            if (values.length === 0) return;

            const bins = d3
                .bin()
                .domain([0, max])
                .thresholds(d3.ticks(0, max, Math.min(binnumber, max)))(
                // Minimum of 10 bins
                values,
            );

            const xScale = d3
                .scaleBand()
                .domain(bins.map((d) => d.x0))
                .range([0, cellSize - padding])
                .padding(0.1);

            if (!intensity) {
                const yScale = d3
                    .scaleLinear()
                    .domain([0, d3.max(bins, (d) => d.length)])
                    .range([cellSize - padding, padding]);

                g.selectAll("rect.bar")
                    .data(bins)
                    .join("rect")
                    .attr("class", "bar")
                    .attr("x", (d) => xScale(d.x0))
                    .attr("y", (d) => yScale(d.length))
                    .attr("width", xScale.bandwidth())
                    .attr(
                        "height",
                        (d) => cellSize - padding - yScale(d.length),
                    )
                    .attr(
                        "fill",
                        colors[d.row < rows - 1 ? d.col % 6 : 6 + (d.col % 2)],
                    )
                    .on("click", function (event) {
                        const store = {
                            ...$cellStateStore,
                            [d.label]: !$cellStateStore[d.label],
                        };
                        cellStateStore.set(store); // Update Svelte store
                        updateCellVisual(d3.select(this.parentNode), d.label); // Update UI
                    });
            } else {
                const yScale = d3
                    .scaleLinear()
                    .domain([0, d3.max(bins, (d) => d.length)])
                    .range([0.2, 1]); // Intensity from 20% to 100%

                const fillColor =
                    colors[d.row < rows - 1 ? d.col % 6 : 6 + (d.col % 2)];

                g.selectAll("rect.bar")
                    .data(bins)
                    .join("rect")
                    .attr("class", "bar")
                    .attr("x", (d) => xScale(d.x0))
                    .attr("y", padding / 2)
                    .attr("width", xScale.bandwidth())
                    .attr("height", cellSize - 2 * padding)
                    .attr("fill", (d) =>
                        d3.color(fillColor).copy({ opacity: yScale(d.length) }),
                    )
                    .on("click", function (event) {
                        const store = {
                            ...$cellStateStore,
                            [d.label]: !$cellStateStore[d.label],
                        };
                        cellStateStore.set(store); // Update Svelte store
                        updateCellVisual(d3.select(this.parentNode), d.label); // Update UI
                    });
            }
        });
    }

    function updateCellVisual(cell, label) {
        cell.selectAll("text.x-mark").remove(); // Remove old "X"

        if ($cellStateStore[label]) {
            cell.append("text")
                .attr("class", "x-mark")
                .attr("x", cellSize / 2)
                .attr("y", cellSize / 2)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("font-size", "20px")
                .attr("fill", "black")
                .attr("opacity", 0.2)
                .text("X")
                .on("click", function (event, d) {
                    const store = {
                        ...$cellStateStore,
                        [d.label]: !$cellStateStore[d.label],
                    };
                    cellStateStore.set(store); // Update Svelte store
                    updateCellVisual(d3.select(this.parentNode), d.label); // Update UI
                });
        }
    }

    $: configs, drawMatrix();
    onMount(drawMatrix);
</script>

<svg bind:this={svg} {width} {height}></svg>
<label class="flex items-center gap-4 p-2 rounded-lg bg-base-200 shadow-md">
    <!-- Bars Label with Icon -->
    <div class="flex items-center gap-1">
        <svg
            class="w-5 h-5 p-1"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 6h16M4 12h8m-8 6h16"
            ></path>
        </svg>
        <span class="label-text font-medium">Bars</span>
    </div>

    <!-- Toggle Switch -->
    <input
        type="checkbox"
        class="toggle toggle-lg toggle-primary"
        bind:checked={intensity}
        on:change={drawMatrix}
    />

    <!-- Opacity Label with Icon -->
    <div class="flex items-center gap-1">
        <svg
            class="w-5 h-5 p-1"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 3v1m0 16v1m8.66-11.66l-.71.71M4.05 4.05l-.71.71M21 12h1M3 12H2m16.95 4.95l-.71.71M6.34 17.66l-.71.71"
            ></path>
        </svg>
        <span class="label-text font-medium">Opacity</span>
    </div>
</label>

<style>
    svg {
        position: relative;
    }
    button {
        background-color: rgb(229, 229, 229);
        border: 1px solid rgb(229, 229, 229);
        color: black;
        padding: 10px 20px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.3s ease;
    }

    button:hover {
        border: 1px solid rgb(79, 79, 79);
        border-color: rgb(79, 79, 79);
    }
</style>
