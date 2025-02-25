<script>
    // @ts-nocheck

    import Dropdown from "./Dropdown.svelte";
    import DetailView from "./DetailView.svelte";
    import MapView from "./MapView.svelte";
    import {
        distanceMatrix,
        readRef,
        readSampled,
        readEdges,
        uploadWav,
        addReference,
        readSpecificFile,
    } from "../utils/serverRequests";
    import {
        getDrProjectedPoints,
        newPointOOD,
        euclideanDistance,
    } from "../utils/dr";
    import { sendMessage } from "../utils/midi";
    import { importSysexFile, getNamefromConfig } from "../utils/sysex";
    import {
        createSysexMessageFromConfig,
        dx7Parameters,
        writeSysEx,
    } from "../utils/dexed";
    import { doAnalysisForValues } from "../utils/analysis";
    import TextView from "./TextView.svelte";
    import ConfigDistributions from "./ConfigHistogram.svelte";
    import {
        exportList,
        data,
        jsonDataList,
        sampledList,
        refList,
        distMatrix,
        startingIndex,
        excluded,
        drpoints,
        edgeList,
    } from "../utils/stores";
    import { onMount } from "svelte";

    let sysexList = [];

    let sysexIndex = 0;

    let oodpoint = null;

    let globalMaxDist = 0;
    let globalMeanDist = 0;

    let tempRef = [];

    let testOODtrigger = false;

    $: pointRenderer = "circle";
    $: pointColor = "brightHarmonic";

    $: selectedPoint = null;

    $: referencePoint = null;

    let dropdownOptions = [
        "LoadDataFromFiles",
        "getSimilarity",
        "resetSelectedPoint",
        "changeRender",
        "changeColor",
        "resetExportList",
        "Export list",
        "resetExclude",
    ];

    // onMount Midiaccess requesten

    // Function to handle dropdown button clicks
    async function handleDropdownClick(option) {
        if (option === "LoadDataFromFiles") {
            sampledList.set(await readSampled());
            tempRef = await readRef();
            edgeList.set(await readEdges());
            jsonDataList.set($sampledList);
            jsonDataList.set(doAnalysisForValues($jsonDataList));
            startingIndex.set(
                Math.max(
                    ...$jsonDataList.map(
                        (d) => d.filename.split("_")[1].split(".")[0],
                    ),
                ) + 1,
            );
            console.log($startingIndex);
            // load edges as well
            alert("Data imported");
        } else if (option === "getSimilarity") {
            if ($jsonDataList.length !== 0) {
                distMatrix.set(await distanceMatrix());
                //DR from distMatrix
                let points = getDrProjectedPoints($distMatrix, "mds", true);
                let temp = [];
                $jsonDataList.forEach((v, i) => {
                    if (
                        v.filename.split(".")[0] !== "patch_16" ||
                        !testOODtrigger
                    )
                        temp.push({
                            id: i,
                            x: points[i][0],
                            y: points[i][1],
                            label: v.filename.split(".")[0],
                            config: v.config,
                            analysis: v,
                        });
                    else
                        oodpoint = {
                            id: i,
                            label: v.filename.split(".")[0],
                            config: v.config,
                            analysis: v,
                        };
                });
                drpoints.set([...temp]);
                tempRef = doAnalysisForValues(tempRef);
                refList.set(
                    tempRef.map((v, i) => {
                        let datapoint = {
                            id: 5000 + i,
                            label: v.filename.split(".")[0],
                            config: v.config,
                            analysis: v,
                        };
                        return newPointOOD(datapoint, $data, $distMatrix);
                    }),
                );
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
        } else if (option === "resetExportList") {
            exportList.set([]);
        } else if (option === "Export list") {
            writeSysEx(exportList);
        } else if (option === "testOod") {
            let oodpoint = newPointOOD(oodpoint, $data);
            data.update((v) => v.push(oodpoint));
        } else if (option === "resetExclude") {
            excluded.set([]);
        }
    }

    // Function to handle point click
    function handlePointClick(event, point) {
        console.log(event, point);
        if (event?.ctrlKey) {
            if (selectedPoint) {
                referencePoint = point;
            } else {
                selectedPoint = point;
                if (point?.config)
                    sendMessage(createSysexMessageFromConfig(point.config));
            }
        } else {
            selectedPoint = point;
            referencePoint = null; // Reset if Ctrl is not held
            if (point && point?.config)
                sendMessage(createSysexMessageFromConfig(point.config));
        }
    }

    function handleReference(e) {
        const config = sysexList[sysexIndex];
        // codec for adding reference
        let test = addReference(config);
        test.then(async (v) => {
            const object = await readSpecificFile("reference", v + ".json");
            const analyzed = doAnalysisForValues([object])[0];
            let datapoint = {
                id: 5000 + $refList.length,
                label: analyzed.filename.split(".")[0],
                config: analyzed.config,
                analysis: analyzed,
            };
            refList.set([...$refList, newPointOOD(datapoint, $drpoints)]);
        });
    }

    async function importWavFile(e) {
        const files = e.target.files;
        const uploads = [];

        for (let file of files) {
            uploads.push(uploadWav(file));
        }

        // Wait for all uploads to complete
        const results = await Promise.all(uploads);

        let temp = [];

        // Process results
        results[0].forEach((result, index) => {
            temp.push(result);
        });
        temp = doAnalysisForValues(temp);
        let analyzed = [];
        temp.forEach((p, i) => {
            let datapoint = {
                id: 5000 + $refList.length + i,
                label: p.filename.split(".")[0],
                config: p.config,
                analysis: p,
            };
            analyzed.push(newPointOOD(datapoint, $drpoints, $distMatrix));
        });

        temp = [...$refList, ...analyzed];
        console.log(temp);

        refList.set(temp);
    }

    async function handleImport(e) {
        await importSysexFile(e).then((v) => {
            sysexList = v;
            console.log(sysexList);
        });
    }
</script>

<div class="container">
    <div class="left">
        <div class="left-top">
            <Dropdown
                options={dropdownOptions}
                onOptionClick={handleDropdownClick}
            />

            <p>Reference</p>
            <div class="center-wrapper">
                <input type="file" accept=".syx" on:change={handleImport} />
            </div>
            {#if sysexList.length > 0}
                <div class="center-wrapper">
                    <select bind:value={sysexIndex}>
                        <!-- Generate options based on indices of the items array -->
                        {#each sysexList as item, index}
                            <option value={index}
                                >{getNamefromConfig(item)}</option
                            >
                        {/each}
                    </select>
                </div>
                <div class="center-wrapper">
                    <button on:click={handleReference}>
                        Add as Reference
                    </button>
                </div>
            {/if}
            <p>New wav file</p>
            <div class="center-wrapper">
                <input
                    type="file"
                    accept=".wav"
                    multiple
                    on:change={importWavFile}
                />
            </div>
        </div>

        <div class="left-bottom">
            <TextView
                title="Left View "
                content="testOOD: {testOODtrigger} - points: {$data.length}"
                parameters={Object.entries(dx7Parameters)}
                configs={$jsonDataList.map((j) => j.config)}
            ></TextView>
        </div>
    </div>

    <div class="middle">
        <MapView
            {pointRenderer}
            {pointColor}
            onPointClick={handlePointClick}
            {selectedPoint}
            {referencePoint}
        />
    </div>

    <div class="right">
        <DetailView {selectedPoint}></DetailView>
    </div>
</div>

<style>
    button {
        margin: 2px;
        padding: 5px 10px;
        border: none;
        background: #007bff;
        color: white;
        cursor: pointer;
        border-radius: 4px;
    }

    button:hover {
        background: #0056b3;
    }

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
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 10px;
        width: 100%;
    }

    .center-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 55%;
    }

    input {
        width: 100%; /* Make input fill the wrapper */
        max-width: 100%; /* Ensure it does not shrink */
        text-align: center; /* Centers text inside the input */
        padding: 10px;
        box-sizing: border-box; /* Ensures padding doesn't affect width */
    }

    .left-bottom {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .middle {
        grid-row: 1;
        grid-column: 2;
        height: 950px;
        width: 950px;
        overflow: hidden;
        border: 1px solid #ccc;
        margin: 8px;
    }

    .right {
        grid-row: 1;
        grid-column: 3;
    }

    p {
        color: black;
    }
</style>
