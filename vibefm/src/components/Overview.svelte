<script>
    // @ts-nocheck

    import Dropdown from "./Dropdown.svelte";
    import DetailView from "./DetailView.svelte";
    import MapView from "./MapView.svelte";
    import { distanceMatrix, readData } from "../utils/serverRequests";
    import { getDrProjectedPoints } from "../utils/dr";
    import { sendMessage } from "../utils/midi";

    // Example data
    let data = [];

    let jsonDataList = [];

    let distMatrix = [];

    $: selectedPoint = null;

    let dropdownOptions = ["LoadDataFromFiles", "getSimilarity"];

    // onMount Midiaccess requesten

    // Function to handle dropdown button clicks
    async function handleDropdownClick(option) {
        if (option === "LoadDataFromFiles") {
            jsonDataList = await readData();
            alert("Data imported");
            console.log(jsonDataList);
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
        }
    }

    // Function to handle point click
    function handlePointClick(point) {
        sendMessage(createSysexMessageFromConfig(point.config));
        selectedPoint = point;
        console.log(selectedPoint);
    }
</script>

<div class="container">
    <div class="header">
        <Dropdown
            options={dropdownOptions}
            onOptionClick={handleDropdownClick}
        />
    </div>

    <div class="left-bottom">
        <DetailView
            title="Left View"
            content="Data: {jsonDataList.length} - points: {data.length}"
        />
    </div>

    <div class="middle">
        <MapView {data} on:pointClick={handlePointClick} />
    </div>

    <div class="right">
        <DetailView title="Right View" content={$selectedPoint?.label} />
    </div>
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: 1fr 3fr 1fr;
        grid-template-rows: auto 1fr;
        height: 100vh;
        gap: 10px;
    }

    .header {
        grid-column: span 3;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        padding: 10px;
        background-color: #f4f4f4;
    }

    .left-bottom {
        grid-row: 2;
        grid-column: 1;
    }

    .middle {
        grid-row: 2;
        grid-column: 2;
    }

    .right {
        grid-row: 2;
        grid-column: 3;
    }
</style>
