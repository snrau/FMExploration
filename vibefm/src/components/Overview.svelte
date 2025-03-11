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
        sendReaper,
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
        interpolatedConfig,
        updateView,
    } from "../utils/stores";
    import { onMount } from "svelte";
    import {
        sampleAllValues,
        sampleBlockValues,
        sampleSingleValues,
        getMultipleRandoms,
    } from "../utils/strategies";
    import { getRandomConfig, getChangableParameters } from "../utils/sampling";

    let sysexList = [];

    let sysexIndex = 0;

    let oodpoint = null;

    let textInput = "Inter0";

    let globalMaxDist = 0;
    let globalMeanDist = 0;

    let tempRef = [];

    let collection = [];

    let prev = 0;

    let testOODtrigger = false;

    let sections = {
        uploadSysEx: false,
        currentSession: false,
        sample: false,
        visualization: false,
        interpolation: false,
        reference: false,
        newWavFile: false,
        export: false,
    };

    const colorOptions = ["brightHarmonic", "algorithm", "feedback", "cluster"];
    const glyphOptions = ["circle", "envelope", "brightness", "config"];

    const strategyOptions = ["allRandom", "seedRandom", "primer"];
    let strategy = "allRandom";
    const valueOptions = ["5%", "10%", "25%", "full"];
    let valueChange = "full";
    const paramOptions = ["all", "single", "operator"];
    let paramChange = "all";

    let withRef = true;

    $: pointRenderer = "circle";
    $: pointColor = "brightHarmonic";

    $: selectedPoint = null;

    $: referencePoint = null;

    $: $updateView,
        async () => {
            await loadSetup();
            calcDistance();
        };

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

    let addPrimer = true;
    let sampleNumber = 10;

    // onMount Midiaccess requesten

    async function loadCurrentSession() {
        await loadSetup();
        calcDistance();
    }

    async function sample(strategy, valueChange, paramChange) {
        collection = [];
        let value = 100;
        if (valueChange !== "full") {
            value = parseInt(valueChange.split("%")[0]);
        }

        let primer = [];
        if (strategy === "allRandom") {
            collection = getMultipleRandoms(sampleNumber);
        } else if (strategy === "seedRandom") {
            primer = getRandomConfig();
        } else if (strategy === "primer") {
            if (sysexList.length > 0) primer = sysexList[sysexIndex];
            else return;
        }
        if (strategy !== "allRandom") {
            console.log(primer);
            if (paramChange === "all") {
                collection = sampleAllValues(primer, value, sampleNumber);
            } else if (paramChange === "single") {
                collection = sampleSingleValues(primer, value);
            } else if (paramChange === "operator") {
                collection = sampleBlockValues(primer, value, sampleNumber);
            }
        }
        if (primer.length > 0 && strategy !== "allRandom" && addPrimer)
            collection = [primer, ...collection];

        console.log(collection, primer);
        if (collection.length > 0) {
            await sendReaper(collection);
            loadCurrentSession();
        }
    }

    async function loadSetup() {
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
    }
    async function calcDistance() {
        if ($jsonDataList.length !== 0) {
            distMatrix.set(await distanceMatrix(withRef));
            //DR from distMatrix

            let points = getDrProjectedPoints($distMatrix, "tsne", true);
            let temp = [];
            $jsonDataList.forEach((v, i) => {
                temp.push({
                    id: i,
                    x: points[i][0],
                    y: points[i][1],
                    label: v.filename.split(".")[0],
                    config: v.config,
                    analysis: v,
                });
            });
            drpoints.set([...temp]);
            tempRef = doAnalysisForValues(tempRef);
            console.log(tempRef, $drpoints, $distMatrix);
            if (!withRef) {
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
            } else {
                let offset = $jsonDataList.length;
                refList.set(
                    tempRef.map((v, i) => {
                        let datapoint = {
                            id: 5000 + i,
                            label: v.filename.split(".")[0],
                            config: v.config,
                            analysis: v,
                            x: points[i + offset][0],
                            y: points[i + offset][1],
                        };
                        return datapoint;
                    }),
                );
            }
        }
    }

    // Function to handle dropdown button clicks
    async function handleDropdownClick(option) {
        if (option === "LoadDataFromFiles") {
            await loadSetup();
            calcDistance();
        } else if (option === "getSimilarity") {
            if ($jsonDataList.length !== 0) {
                distMatrix.set(await distanceMatrix());
                //DR from distMatrix
                let points = getDrProjectedPoints($distMatrix, "tsne", true);
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
            else if (pointColor === "feedback") pointColor = "cluster";
            else if (pointColor === "cluster") pointColor = "brightHarmonic";
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
        let test = addReference(config, true);
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

    function handleInterpolation(e) {
        let config = [...$interpolatedConfig];
        if (config === []) return;

        for (let i = 0; i < 10; i++) {
            config[145 + i] = textInput.charCodeAt(i) || 32;
        }
        // codec for adding reference
        let test = addReference(config, false);
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
        referencePoint = null;
        textInput = "Inter";
        interpolatedConfig.set([]);
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

    async function importJsonFile(e) {
        // import json file
        const files = e.target.files;
        if (files.length === 0) return;

        const file = files[0];
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const content = event.target.result;
                let jsonData = JSON.parse(content);
                await sendReaper(jsonData);
                loadCurrentSession();
            } catch (error) {
                console.error("Error parsing JSON:", error);
            }
        };

        reader.readAsText(file);
    }

    async function exportSession() {
        let temp = [];
        $sampledList.forEach((v) => {
            temp.push(v.config);
        });
        let blob = new Blob([JSON.stringify(temp)], {
            type: "application/json",
        });
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = "session.json";
        a.click();
    }

    function toggleSection(section) {
        sections[section] = !sections[section];
    }
</script>

<div class="container">
    <div class="left">
        <div class="left-top">
            <h2>VibeFM</h2>
            <p on:click={() => toggleSection("uploadSysEx")}>Upload SysEx</p>
            {#if sections.uploadSysEx}
                <div class="center-wrapper">
                    <input type="file" accept=".syx" on:change={handleImport} />
                </div>
                <select bind:value={sysexIndex}>
                    {#each sysexList as item, index}
                        <option value={index}>{getNamefromConfig(item)}</option>
                    {/each}
                </select>
            {/if}

            <p on:click={() => toggleSection("currentSession")}>
                Load Sessions
            </p>
            {#if sections.currentSession}
                <div class="center-wrapper">
                    <button on:click={loadCurrentSession}
                        >Load Current Session</button
                    >
                </div>
                <div class="center-wrapper">
                    <button on:click={calcDistance}
                        >Recalculate Distances</button
                    >
                </div>
                <div class="center-wrapper-full">
                    <input
                        class="checkbox"
                        type="checkbox"
                        bind:checked={withRef}
                    />
                    <span>{withRef ? "use ref Layout" : "no ref layout"}</span>
                </div>
                <span>load from Json</span>
                <div class="center-wrapper">
                    <div class="center-wrapper">
                        <input
                            type="file"
                            accept=".json"
                            on:change={importJsonFile}
                        />
                    </div>
                </div>
            {/if}

            <p on:click={() => toggleSection("sample")}>Sample</p>
            {#if sections.sample}
                <div class="center-wrapper-full">
                    <label for="sample-number">Samples:</label>
                    <input
                        type="number"
                        id="sample-number"
                        bind:value={sampleNumber}
                        on:change={(prev = 0)}
                        min="1"
                    />
                </div>
                <div class="center-wrapper-full">
                    <label for="strategy-select">Strategy:</label>
                    <select id="strategy-select" bind:value={strategy}>
                        {#each strategyOptions as glyph}
                            <option value={glyph}>{glyph}</option>
                        {/each}
                    </select>
                </div>
                {#if strategy !== "allRandom"}
                    <div class="center-wrapper-full">
                        <label for="value-select">Valuechange:</label>
                        <select id="value-select" bind:value={valueChange}>
                            {#each valueOptions as glyph}
                                <option value={glyph}>{glyph}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="center-wrapper-full">
                        <label for="param-select">Paramchange:</label>
                        <select
                            id="param-select"
                            bind:value={paramChange}
                            on:change={() => {
                                if (paramChange === "single") {
                                    prev = sampleNumber;
                                    sampleNumber =
                                        getChangableParameters().length();
                                } else {
                                    sampleNumber =
                                        prev !== 0 ? prev : sampleNumber;
                                    prev = 0;
                                }
                            }}
                        >
                            {#each paramOptions as glyph}
                                <option value={glyph}>{glyph}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="center-wrapper-full">
                        <input
                            class="checkbox"
                            type="checkbox"
                            bind:checked={addPrimer}
                        />
                        <span>{addPrimer ? "addPrimer" : "noPrimer"}</span>
                    </div>
                {/if}
                {#if strategy === "primer"}
                    {#if sysexList.length > 0}
                        <span>{getNamefromConfig(sysexList[sysexIndex])}</span>
                    {:else}
                        <span>No Primer available</span>
                    {/if}
                {/if}
                <div class="center-wrapper">
                    <button
                        on:click={() =>
                            sample(strategy, valueChange, paramChange)}
                        >Sample</button
                    >
                </div>
                <div class="center-wrapper">
                    <button
                        on:click={() => doAnalysis(collection, $startingIndex)}
                        >doAnalysis</button
                    >
                </div>
                <!--
                    call function with different sample stategies
                    then automatically do the analysis and then recalculate the distances
                    sample("random", false, false);
                    have small and large changes and single or all parameter changes

                    // completely random -> all
                    // similar random seed -> single, all, block, small, large
                    // similar primer -> single, all, block, small, large
                    
                -->
            {/if}

            <p on:click={() => toggleSection("visualization")}>Visualization</p>
            {#if sections.visualization}
                <div class="center-wrapper-full">
                    <label for="color-select">Color:</label>
                    <select id="color-select" bind:value={pointColor}>
                        {#each colorOptions as color}
                            <option value={color}>{color}</option>
                        {/each}
                    </select>
                </div>
                <div class="center-wrapper-full">
                    <label for="glyph-select">Glyph:</label>
                    <select id="glyph-select" bind:value={pointRenderer}>
                        {#each glyphOptions as glyph}
                            <option value={glyph}>{glyph}</option>
                        {/each}
                    </select>
                </div>
                <div class="center-wrapper">
                    <button on:click={() => excluded.set([])}
                        >Reset excluded</button
                    >
                </div>
            {/if}

            <p on:click={() => toggleSection("interpolation")}>Interpolation</p>
            {#if sections.interpolation}
                <div class="center-wrapper">
                    <input
                        type="text"
                        bind:value={textInput}
                        maxlength="10"
                        placeholder="Config Name"
                    />
                </div>
                <div class="center-wrapper">
                    <button on:click={handleInterpolation}
                        >Add as Reference</button
                    >
                </div>
            {/if}

            <p on:click={() => toggleSection("reference")}>Reference</p>
            {#if sections.reference}
                <div class="center-wrapper">
                    {#if sysexList.length > 0 && sysexIndex >= 0}
                        <span>{getNamefromConfig(sysexList[sysexIndex])}</span>
                    {:else}
                        <span>No Sysex Reference selected</span>
                    {/if}
                </div>
                {#if sysexList.length > 0}
                    <div class="center-wrapper">
                        <button on:click={handleReference}>
                            Add as Reference
                        </button>
                    </div>
                {/if}
            {/if}

            <p on:click={() => toggleSection("newWavFile")}>New wav file</p>
            {#if sections.newWavFile}
                <div class="center-wrapper">
                    <input
                        type="file"
                        accept=".wav"
                        multiple
                        on:change={importWavFile}
                    />
                </div>
            {/if}

            <p on:click={() => toggleSection("export")}>Export</p>
            {#if sections.export}
                <div class="center-wrapper">
                    <button on:click={() => exportList.set([])}
                        >Reset export list</button
                    >
                </div>
                <div class="center-wrapper">
                    <button on:click={() => writeSysEx(exportList)}
                        >Export Config.syx</button
                    >
                </div>
                <div class="center-wrapper">
                    <button on:click={() => exportSession()}
                        >Export Session</button
                    >
                </div>
            {/if}
        </div>

        <div class="left-bottom">
            <TextView
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
        background: rgb(225, 225, 225);
        color: rgb(0, 0, 0);
        cursor: pointer;
        border-radius: 10px;
    }

    h2 {
        margin: 0;
    }

    button:hover {
        background: #525252;
        color: white;
    }

    select {
        padding: 5px;
        border-radius: 5px;
        border: 1px solid #ccc;
    }

    .container {
        display: grid;
        grid-template-columns: 250px 3fr 500px;
        grid-template-rows: 1fr;
        height: 900px;
        gap: 10px;
    }

    .left {
        display: grid;
        grid-template-rows: 2fr 1fr; /* Stack two views vertically */
        grid-template-columns: 1fr; /* Single column */
        background-color: #f8f9fa;
        border-right: 1px solid #ddd;
    }

    .left-top {
        display: flex;
        flex-direction: column;
        margin-top: 20px;
        align-items: center;
        overflow-y: auto;
        gap: 10px;
        width: 100%;
        max-height: 700px;
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* Internet Explorer 10+ */
    }
    .left-top::-webkit-scrollbar {
        display: none; /* Safari and Chrome */
    }

    p {
        margin-top: 0;
        color: rgb(0, 0, 0);
        cursor: pointer;
        font-weight: bold;
        background-color: rgb(141, 171, 193);
        padding: 5px;
        border-radius: 10px;
        width: 95%;
    }
    p:hover {
        background: #e5e5e5;
    }

    .center-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 65%;
    }

    .center-wrapper-full {
        display: grid;
        grid-template-columns: 1fr 2fr;
        justify-content: center;
        align-items: baseline;
        gap: 10px;
        width: 85%;
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
        height: 1070px;
        width: 1070px;
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
