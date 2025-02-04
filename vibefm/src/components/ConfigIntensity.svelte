<script>
    import * as d3 from "d3";
    import { onMount } from "svelte";

    export let parameters = []; // { index, change, max }
    export let configs = []; // Array of arrays: configs[row][col] = [values]
    export let cellSize = 30;
    export let binnumber = 10;

    const rows = 7;
    const cols = 6;
    const padding = 3;
    const width = cols * cellSize;
    const height = rows * cellSize;
    let svg;

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
            const row = Math.floor(i / cols);
            const col = i % cols;
            const values = configs.map((a) => a[d[1].number]);
            return { row, col, values, max: d[1].max };
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
                (d) => `translate(${d.col * cellSize}, ${d.row * cellSize})`,
            );

        cells
            .append("rect")
            .attr("width", cellSize - padding)
            .attr("height", cellSize - padding)
            .attr("fill", "none")
            .attr("stroke", "black");

        cells.each(function (d) {
            const g = d3.select(this);
            let { values, max } = d;

            if (values.length === 0) return;

            const bins = d3
                .bin()
                .domain([0, max])
                .thresholds(d3.ticks(0, max, Math.min(binnumber, max)))(values);

            const xScale = d3
                .scaleBand()
                .domain(bins.map((d) => d.x0))
                .range([0, cellSize - padding]);

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
                );
        });
    }

    $: configs, drawMatrix();
    onMount(drawMatrix);
</script>

<svg bind:this={svg} {width} {height}></svg>

<style>
    svg {
        position: relative;
    }
</style>
