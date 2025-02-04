<script>
    // @ts-nocheck

    import Dropdown from "./Dropdown.svelte";
    import DetailView from "./DetailView.svelte";
    import MapView from "./MapView.svelte";
    import { distanceMatrix, readData } from "../utils/serverRequests";
    import { getDrProjectedPoints } from "../utils/dr";
    import { sendMessage } from "../utils/midi";
    import {
        createSysexMessageFromConfig,
        dx7Parameters,
    } from "../utils/dexed";
    import { doAnalysisForValues } from "../utils/analysis";
    import TextView from "./TextView.svelte";
    import ConfigDistributions from "./ConfigHistogram.svelte";

    // Example data
    let data = [];

    let jsonDataList = [];

    let distMatrix = [];

    $: pointRenderer = "circle";
    $: pointColor = "brightHarmonic";

    $: selectedPoint = null;

    let dropdownOptions = [
        "LoadDataFromFiles",
        "getSimilarity",
        "resetSelectedPoint",
        "changeRender",
        "changeColor",
    ];

    // onMount Midiaccess requesten

    // Function to handle dropdown button clicks
    async function handleDropdownClick(option) {
        if (option === "LoadDataFromFiles") {
            jsonDataList = await readData();
            jsonDataList = doAnalysisForValues(jsonDataList);
            console.log(jsonDataList);
            alert("Data imported");
        } else if (option === "getSimilarity") {
            if (jsonDataList.length !== 0) {
                distMatrix = await distanceMatrix();
                //DR from distMatrix
                console.log(distMatrix);
                let points = getDrProjectedPoints(distMatrix, "mds", true);
                let temp = [];
                jsonDataList.forEach((v, i) => {
                    temp.push({
                        id: i,
                        x: points[i][0],
                        y: points[i][1],
                        label: "patch_" + i,
                        config: v.config,
                        analysis: v,
                    });
                });
                data = [...temp];
                console.log(data);
                alert("Points calculated");
            }
        } else if (option === "resetSelectedPoint") {
            selectedPoint = null;
        } else if (option === "changeRender") {
            if (pointRenderer === "circle") pointRenderer = "glyph";
            else if (pointRenderer === "glyph") pointRenderer = "brightness";
            else if (pointRenderer === "brightness") pointRenderer = "config";
            else if (pointRenderer === "config") pointRenderer = "circle";
        } else if (option === "changeColor") {
            if (pointColor === "brightHarmonic") pointColor = "algorithm";
            else if (pointColor === "algorithm") pointColor = "feedback";
            else if (pointColor === "feedback") pointColor = "brightHarmonic";
        }
    }

    // Function to handle point click
    function handlePointClick(point) {
        sendMessage(createSysexMessageFromConfig(point.config));
        selectedPoint = point;
        //play wav?
    }
</script>

<div class="container">
    <div class="left">
        <div class="left-top">
            <Dropdown
                options={dropdownOptions}
                onOptionClick={handleDropdownClick}
            />
        </div>

        <div class="left-bottom">
            <TextView
                title="Left View"
                content="Data: {jsonDataList.length} - points: {data.length}"
                parameters={Object.entries(dx7Parameters)}
                configs={jsonDataList.map((j) => j.config)}
            ></TextView>
        </div>
    </div>

    <div class="middle">
        <MapView
            {data}
            {pointRenderer}
            {pointColor}
            onPointClick={handlePointClick}
            {selectedPoint}
        />
    </div>

    <div class="right">
        <DetailView {selectedPoint}></DetailView>
    </div>
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: 250px 3fr 450px;
        grid-template-rows: 1fr;
        height: 900px;
        gap: 10px;
    }

    .left {
        display: grid;
        grid-template-rows: 1fr 1fr; /* Stack two views vertically */
        grid-template-columns: 1fr; /* Single column */
        background-color: #f8f9fa;
        border-right: 1px solid #ddd;
    }

    .left-top {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .left-bottom {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .middle {
        grid-row: 1;
        grid-column: 2;
    }

    .right {
        grid-row: 1;
        grid-column: 3;
    }
</style>
