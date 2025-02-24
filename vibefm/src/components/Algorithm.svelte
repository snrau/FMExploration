<script>
    import * as d3 from "d3";
    import { interaction } from "pixi.js";
    import { onMount } from "svelte";

    // Configuration for the algorithm (example number for different layouts)
    export let algorithm = 0;
    export let config = null;

    // Modulator structures for each algorithm
    const layouts = {
        0: [-1, 0, -1, 2, 3, 4, [5, 5, true]],
        1: [-1, 0, -1, 2, 3, 4, [1, 1, true]],
        2: [-1, 0, 1, -1, 3, 4, [5, 5, true]],
        3: [-1, 0, 1, -1, 3, 4, [3, 5, true]],
        4: [-1, 0, -1, 2, -1, 4, [5, 5, true]],
        5: [-1, 0, -1, 2, -1, 4, [4, 5, true]],
        6: [-1, 0, -1, 2, 2, 4, [5, 5, true]],
        7: [-1, 0, -1, 2, 2, 4, [3, 3, true]],
        8: [-1, 0, -1, 2, 2, 4, [1, 1, true]],
        9: [-1, 0, 1, -1, 3, 3, [2, 2, true]],
        10: [-1, 0, 1, -1, 3, 3, [5, 5, true]],
        11: [-1, 0, -1, 2, 2, 2, [1, 1, true]],
        12: [-1, 0, -1, 2, 2, 2, [5, 5, true]],
        13: [-1, 0, -1, 2, 3, 3, [5, 5, true]],
        14: [-1, 0, -1, 2, 3, 3, [1, 1, true]],
        15: [-1, 0, 0, 2, 0, 4, [5, 5, true]],
        16: [-1, 0, 0, 2, 0, 4, [1, 1, true]],
        17: [-1, 0, 0, 0, 3, 4, [2, 2, true]],
        18: [-1, 0, 1, -1, -1, 3, [5, 5, true], [5, 4, false]],
        19: [-1, -1, 0, -1, 3, 3, [2, 2, true], [2, 1, false]],
        20: [-1, -1, 0, -1, -1, 3, [2, 2, true], [2, 1, false], [5, 4, false]],
        21: [-1, 0, -1, -1, -1, 2, [5, 5, true], [5, 3, false], [5, 4, false]],
        22: [-1, -1, 1, -1, -1, 3, [5, 5, true], [5, 4, false]],
        23: [-1, -1, -1, -1, -1, 2, [5, 5, true], [5, 4, false], [5, 3, false]],
        24: [-1, -1, -1, -1, -1, 3, [5, 5, true], [5, 4, false]],
        25: [-1, -1, 1, -1, 3, 3, [5, 5, true]],
        26: [-1, -1, 1, -1, 3, 3, [2, 2, true]],
        27: [-1, 0, -1, 2, 3, -1, [4, 4, true]],
        28: [-1, -1, -1, 2, -1, 4, [5, 5, true]],
        29: [-1, -1, -1, 2, 3, -1, [4, 4, true]],
        30: [-1, -1, -1, -1, -1, 4, [5, 5, true]],
        31: [-1, -1, -1, -1, -1, -1, [5, 5, true]],
    };

    let xOffset = 5; // Initial X offset
    let yOffset = 5; // Lower Y offset so outputs are at the bottom
    let boxWidth = 35;
    let boxHeight = 20;
    let spacingX = 55; // Space between modulators
    let spacingY = 35; // Space between rows

    let modulatorPositions = [];
    let connectionLines = [];
    let lastRow = [];
    let rowMapping = {}; // Stores row index of each modulator
    let xPositions = {}; // Stores calculated X positions

    let maxRowCount = 0;
    let oldAlgorithm = -1;

    function generateLayout() {
        oldAlgorithm = algorithm;
        //if (config === null) return;
        const layout = layouts[algorithm];
        modulatorPositions = [];
        connectionLines = [];
        lastRow = [];
        rowMapping = {};
        xPositions = {};

        let nextX = xOffset; // Track next available X position

        let occupied = new Set();

        // First pass: Determine positions
        layout.forEach((item, index) => {
            if (Array.isArray(item)) return;

            let rowIndex = item === -1 ? 0 : (rowMapping[item] ?? 0) + 1;
            rowMapping[index] = rowIndex;

            if (rowIndex > maxRowCount) {
                maxRowCount = rowIndex;
            }
        });

        // First pass: Determine positions
        layout.forEach((item, index) => {
            if (Array.isArray(item)) return;

            let rowIndex = item === -1 ? 0 : (rowMapping[item] ?? 0) + 1;
            rowMapping[index] = rowIndex;

            let y = (maxRowCount + 1 - rowIndex) * spacingY - yOffset;

            let x;
            if (item === -1) {
                // Outputs are placed sequentially at the bottom
                x = nextX;
                nextX += spacingX;
            } else {
                // Place directly above parent
                x = xPositions[item] ?? nextX;
                while (occupied.has(`${x},${y}`)) {
                    x = nextX;
                    nextX += spacingX;
                }
            }
            occupied.add(`${x},${y}`);

            xPositions[index] = x;

            modulatorPositions.push({ modulator: index, x, y });

            if (rowIndex === 0) lastRow.push({ modulator: index, x, y });
        });

        // Calculate the maximum width and height
        const maxX = Math.max(...modulatorPositions.map((m) => m.x)) + boxWidth;

        // Calculate the center of the diagram
        const centerX = (maxX + xOffset) / 2;
        //const centerY = (maxY  + yOffset) / 2 - 5;

        // Set the SVG container size
        const svg = d3.select("#svg-container");
        svg.attr("width", maxX + xOffset).attr("height", 150);

        // Apply transform to center the content in the viewBox
        svg.attr(
            "viewBox",
            `${centerX - (maxX + xOffset) / 2} ${0} ${maxX + xOffset} ${150}`,
        );

        // Second pass: Define connections
        layout.forEach((item, index) => {
            if (Array.isArray(item)) {
                connectionLines.push({
                    source: item[0],
                    target: item[1],
                    isLoop: item[2],
                }); // Treat loop as a normal edge
            } else if (item !== -1) {
                connectionLines.push({ source: index, target: item });
            }
        });

        // Add vertical connections from bottom row to bottom line
        lastRow.forEach((mod) => {
            connectionLines.push({
                source: mod.modulator,
                target: "bottomLine",
            });
        });

        // Create the bottom horizontal line if multiple bottom modulators exist
        if (lastRow.length > 1) {
            connectionLines.push({
                source: "bottomLineStart",
                target: "bottomLineEnd",
                x1: lastRow[0].x + boxWidth / 2,
                x2: lastRow[lastRow.length - 1].x + boxWidth / 2,
                y: lastRow[0].y + boxHeight + 10,
            });
        }

        drawDiagram();
    }

    function calcFreqAndLevel() {
        const modulatorInfo = [];

        // Iterate through modulators 5 to 0 (reversed order)
        for (let mod = 5; mod >= 0; mod--) {
            if (mod < 126) {
                // Only process if modulator index is less than 126
                const index = 5 - mod;

                // Get the values from the config array using modulo 21
                let fc = config[18 + index * 21]; // fc corresponds to index + 18
                let ff = config[19 + index * 21]; // ff corresponds to index + 19
                const level = config[16 + index * 21]; // level corresponds to index + 16

                let newfc = fc === 0 ? 0.5 : fc;
                let newff = 1 + ff / 99;

                // Push the extracted information into the result array
                modulatorInfo.push({
                    modulator: mod,
                    fc: newfc,
                    ff: newff,
                    level,
                });
            }
        }
        modulatorInfo.sort((a, b) => a.modulator - b.modulator);

        return modulatorInfo;
    }

    function drawDiagram() {
        const values = calcFreqAndLevel();
        const svg = d3.select("#svg-container");
        svg.selectAll("*").remove(); // Clear previous diagram

        // Draw connection lines
        connectionLines.forEach(({ source, target, isLoop, x1, x2, y }) => {
            let sourcePos = modulatorPositions.find(
                (m) => m.modulator === source,
            );
            let targetPos = modulatorPositions.find(
                (m) => m.modulator === target,
            );

            if (source === "bottomLineStart") {
                // Draw bottom horizontal output line
                svg.append("line")
                    .attr("x1", x1)
                    .attr("y1", y)
                    .attr("x2", x2)
                    .attr("y2", y)
                    .attr("stroke", "black")
                    .attr("stroke-width", 2);
            } else if (sourcePos && targetPos) {
                if (isLoop) {
                    // Draw a loop edge from right side of the box
                    let loopX = sourcePos.x + boxWidth + 5;
                    let loopY1 = sourcePos.y + boxHeight / 2;
                    let loopY2 = targetPos.y + boxHeight / 2;
                    if (source === target) {
                        // Draw a self-loop with an offset
                        loopX = sourcePos.x + boxWidth + 5; // 5px offset to the right
                        loopY1 = sourcePos.y + boxHeight - 4; // Bottom of the box
                        loopY2 = targetPos.y + 4; // Top of the box
                    }

                    svg.append("path")
                        .attr(
                            "d",
                            `M ${sourcePos.x + boxWidth},${loopY1} 
                        H ${loopX} 
                        V ${loopY2} 
                        H ${targetPos.x + boxWidth}`,
                        )
                        .attr("stroke", "black")
                        .attr("stroke-width", 2)
                        .attr("fill", "none");
                } else {
                    // Regular connections
                    svg.append("line")
                        .attr("x1", sourcePos.x + boxWidth / 2)
                        .attr("y1", sourcePos.y + boxHeight)
                        .attr("x2", targetPos.x + boxWidth / 2)
                        .attr("y2", targetPos.y)
                        .attr("stroke", "black")
                        .attr("stroke-width", 2);
                }
            } else if (sourcePos && target === "bottomLine") {
                // Vertical connection from modulator to output line
                svg.append("line")
                    .attr("x1", sourcePos.x + boxWidth / 2)
                    .attr("y1", sourcePos.y + boxHeight)
                    .attr("x2", sourcePos.x + boxWidth / 2)
                    .attr("y2", sourcePos.y + boxHeight + 11)
                    .attr("stroke", "black")
                    .attr("stroke-width", 2);
            }
        });

        // Draw modulator boxes
        svg.selectAll(".modulator")
            .data(modulatorPositions)
            .enter()
            .append("rect")
            .attr("class", "modulator")
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .attr("width", boxWidth)
            .attr("height", boxHeight)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 2);

        // Draw a level indicator line inside the modulator boxes
        svg.selectAll(".level-line")
            .data(modulatorPositions)
            .enter()
            .append("line")
            .attr("class", "level-line")
            .attr("x1", (d) => d.x)
            .attr(
                "y1",
                (d) =>
                    d.y +
                    boxHeight -
                    (values[d.modulator].level / 100) * boxHeight,
            ) // Calculate the y position based on level
            .attr("x2", (d) => d.x + boxWidth) // Extend the line across the full width of the box
            .attr(
                "y2",
                (d) =>
                    d.y +
                    boxHeight -
                    (values[d.modulator].level / 100) * boxHeight,
            ) // The y position is the same as y1
            .attr("stroke", "orange") // Color of the level line
            .attr("stroke-width", 2); // Line width

        modulatorPositions.forEach((d) => {
            const fc = values[d.modulator].fc;
            const ff = values[d.modulator].ff;

            /*
            // Generate sine wave points
            const sinePoints = d3.range(0, boxWidth).map((i) => {
                const x = d.x + i;
                const y =
                    d.y +
                    boxHeight -
                    (values[d.modulator].level / 100) * boxHeight +
                    Math.sin((i / boxWidth) * (2 * Math.PI * ff * fc)) * 5;
                return [x, y];
            });
            */

            // Draw Modulator Number
            svg.append("text")
                .attr("x", () => d.x + boxWidth / 2)
                .attr("y", () => d.y + boxHeight / 2 + 5)
                .attr("text-anchor", "middle")
                .attr("font-size", "10px")
                .attr("fill", "black")
                //.text(d.modulator + 1);
                .html(() => {
                    return `<tspan font-weight="bold">${d.modulator + 1}</tspan>: ${(fc * ff).toFixed(1)}`;
                });

            /*
            // Draw Sine Wave Representation
            const wavePath = d3
                .line()
                .x((_, i) => d.x + i)
                .y(
                    (_, i) =>
                        d.y +
                        boxHeight -
                        (values[d.modulator].level / 100) * boxHeight +
                        Math.sin(i * 0.5 * fc * ff) * 5,
                )
                .curve(d3.curveBasis);

            svg.append("path")
                .datum(sinePoints)
                .attr(
                    "d",
                    d3
                        .line()
                        .x((d) => d[0])
                        .y((d) => d[1])
                        .curve(d3.curveBasis),
                )
                .attr("stroke", ff * fc > 30 ? "forestgreen" : "navy")
                .attr("stroke-width", 1)
                .attr("fill", "none");
            */
        });

        /*
        // Draw modulator labels
        svg.selectAll(".modulator-label")
            .data(modulatorPositions)
            .enter()
            .append("text")
            .attr("x", (d) => d.x + boxWidth / 2)
            .attr("y", (d) => d.y + boxHeight / 2 + 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "black")
            .html((d) => {
                const fc =
                    values[d.modulator].fc === 0
                        ? 0.5
                        : (values[d.modulator].fc / 99) * 31;
                const ff = 1 + values[d.modulator].fc / 99;
                return return `<tspan font-weight="bold">${d.modulator + 1}</tspan>
                <tspan x="${d.x + boxWidth / 2}" dy="12">${(fc * ff).toFixed(1)}</tspan>`;
            });
            */
    }

    onMount(generateLayout);

    $: algorithm, generateLayout();
    $: config, drawDiagram();
</script>

<div class="svg-container-wrapper">
    <svg id="svg-container"></svg>
</div>

<style>
    .svg-container-wrapper {
        display: flex;
        justify-content: center; /* Center the SVG horizontally */
        align-items: center; /* Center the SVG vertically if the container has a height */
        height: 150px; /* Optional: Set a full viewport height for centering */
    }
    #svg-container {
        display: block;
        margin: 0 auto;
    }

    .modulator {
    }

    .line {
        stroke: black;
        stroke-width: 2;
    }

    .vertical-line {
        stroke: black;
        stroke-width: 2;
    }
</style>
