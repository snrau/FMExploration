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
        doAnalysis,
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
        sysexInterpolation,
        numSamples,
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
    const glyphOptions = ["circle", "envelope", "brightness", "config", "mel"];

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
        if ($jsonDataList.length !== 0 || (withRef && refList.length !== 0)) {
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

    let activesection = "uploadSysEx";
    /*uploadSysEx: true,
        currentSession: false,
        sample: false,
        visualization: false,
        interpolation: false,
        reference: false,
        newWavFile: false,
        export: false,
        */

    function changeTab(name, element) {
        console.log(name);
        if (activesection === name) activesection = "";
        else activesection = name;
        document.querySelectorAll("ul > li").forEach((el) => {
            el.classList.remove("active-tab");
            if (el.id === activesection) {
                el.classList.add("active-tab");
            }
        });
    }
</script>

<div
    class="grid grid-cols-[30px_300px_1fr_500px] gap-4 h-screen bg-base-200 text-base-content p-4"
>
    <div class="flex h-full">
        <ul
            class="bg-base-200 rounded-lg w-[30px] py-2 px-0 space-y-0 flex flex-col gap-0"
        >
            <li
                class="active-tab relative w-full h-[70px] bg-base-100 border border-base-300 shadow-md hover:border-primary transition-all duration-200 cursor-pointer"
                id="uploadSysEx"
                on:click={() => changeTab("uploadSysEx", this)}
            >
                <div class="absolute inset-0 flex items-center justify-center">
                    <span
                        class="text-sm tracking-wide font-semibold rotate-90 text-primary/50"
                        >SysEx</span
                    >
                </div>
            </li>
            <li
                class="relative w-full h-[70px] bg-base-100 border border-base-300 shadow-md hover:border-primary transition-all duration-200 cursor-pointer"
                id="currentSession"
                on:click={changeTab("currentSession", this)}
            >
                <div class="absolute inset-0 flex items-center justify-center">
                    <span
                        class="text-sm tracking-wide font-semibold rotate-90 text-primary/50"
                    >
                        Session
                    </span>
                </div>
            </li>

            <li
                class="relative w-full h-[70px] bg-base-100 border border-base-300 shadow-md hover:border-primary transition-all duration-200 cursor-pointer"
                id="sample"
                on:click={changeTab("sample", this)}
            >
                <div class="absolute inset-0 flex items-center justify-center">
                    <span
                        class="text-sm tracking-wide font-semibold rotate-90 text-primary/50"
                    >
                        Sample
                    </span>
                </div>
            </li>
            <li
                class="relative w-full h-[115px] bg-base-100 border border-base-300 shadow-md hover:border-primary transition-all duration-200 cursor-pointer"
                id="visualization"
                on:click={changeTab("visualization", this)}
            >
                <div class="absolute inset-0 flex items-center justify-center">
                    <span
                        class="text-sm tracking-wide font-semibold rotate-90 text-primary/50"
                    >
                        Visualization
                    </span>
                </div>
            </li>
            <li
                class="relative w-full h-[115px] bg-base-100 border border-base-300 shadow-md hover:border-primary transition-all duration-200 cursor-pointer"
                id="interpolation"
                on:click={changeTab("interpolation", this)}
            >
                <div class="absolute inset-0 flex items-center justify-center">
                    <span
                        class="text-sm tracking-wide font-semibold rotate-90 text-primary/50"
                    >
                        Interpolation
                    </span>
                </div>
            </li>
            <li
                class="relative w-full h-[115px] bg-base-100 border border-base-300 shadow-md hover:border-primary transition-all duration-200 cursor-pointer"
                id="reference"
                on:click={changeTab("reference", this)}
            >
                <div class="absolute inset-0 flex items-center justify-center">
                    <span
                        class="text-sm tracking-wide font-semibold rotate-90 text-primary/50"
                    >
                        SyxReference
                    </span>
                </div>
            </li>
            <li
                class="relative w-full h-[115px] bg-base-100 border border-base-300 shadow-md hover:border-primary transition-all duration-200 cursor-pointer"
                id="newWavFile"
                on:click={changeTab("newWavFile", this)}
            >
                <div class="absolute inset-0 flex items-center justify-center">
                    <span
                        class="text-sm tracking-wide font-semibold rotate-90 text-primary/50"
                    >
                        WavReference
                    </span>
                </div>
            </li>
            <li
                class="relative w-full h-[70px] bg-base-100 border border-base-300 shadow-md hover:border-primary transition-all duration-200 cursor-pointer"
                id="export"
                on:click={changeTab("export", this)}
            >
                <div class="absolute inset-0 flex items-center justify-center">
                    <span
                        class="text-sm tracking-wide font-semibold rotate-90 text-primary/50"
                    >
                        Export
                    </span>
                </div>
            </li>
        </ul>
    </div>

    <!-- Left Sidebar Card -->
    <aside class="card bg-base-100 shadow-xl overflow-hidden">
        <div class="card-body p-4">
            <!-- Header -->
            <h2 class="card-title text-primary">VibeFM</h2>

            <div class="mt-4">
                {#if activesection === "uploadSysEx"}
                    <div>uploadSysEx</div>
                {/if}
                {#if activesection === "currentSession"}
                    <div>currentSession</div>
                {/if}
                {#if activesection === "sample"}
                    <div>sample</div>
                {/if}
            </div>

            <!-- Section Navigation -->
            <div class="mt-4 space-y-2">
                <div>
                    <div
                        class="mt-2 p-3 rounded-lg bg-base-200 shadow-inner space-y-4"
                    >
                        {#if activesection === "uploadSysEx"}
                            <input
                                type="file"
                                accept=".syx"
                                on:change={handleImport}
                                class="file-input file-input-bordered w-full"
                            />
                            <select
                                bind:value={sysexIndex}
                                class="select select-bordered w-full"
                            >
                                {#each sysexList as item, index}
                                    <option value={index}
                                        >{getNamefromConfig(item)}</option
                                    >
                                {/each}
                            </select>
                        {/if}

                        {#if activesection === "currentSession"}
                            <button
                                on:click={loadCurrentSession}
                                class="btn btn-primary w-full"
                                >Load Current Session</button
                            >
                            <button
                                on:click={calcDistance}
                                class="btn btn-secondary w-full"
                                >Recalculate Distances</button
                            >

                            <label class="flex items-center gap-2">
                                <span class="label-text">Ref Layout</span>
                                <input
                                    type="checkbox"
                                    bind:checked={withRef}
                                    class="toggle toggle-sm toggle-primary"
                                />
                            </label>

                            <input
                                type="file"
                                accept=".json"
                                on:change={importJsonFile}
                                class="file-input file-input-bordered w-full"
                            />
                        {/if}

                        {#if activesection === "sample"}
                            <label class="form-control w-full">
                                <div class="label">
                                    <span class="label-text">Samples</span>
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    bind:value={sampleNumber}
                                    on:change={() => {
                                        prev = 0;
                                        numSamples.set(sampleNumber);
                                    }}
                                    class="input input-bordered w-full"
                                />
                            </label>

                            <select
                                bind:value={strategy}
                                class="select select-bordered w-full"
                            >
                                {#each strategyOptions as glyph}
                                    <option value={glyph}>{glyph}</option>
                                {/each}
                            </select>

                            {#if strategy !== "allRandom"}
                                <select
                                    bind:value={valueChange}
                                    class="select select-bordered w-full"
                                >
                                    {#each valueOptions as glyph}
                                        <option value={glyph}>{glyph}</option>
                                    {/each}
                                </select>

                                <select
                                    bind:value={paramChange}
                                    class="select select-bordered w-full"
                                    on:change={() => {
                                        if (paramChange === "single") {
                                            prev = sampleNumber;
                                            sampleNumber =
                                                getChangableParameters().length();
                                        } else {
                                            sampleNumber =
                                                prev !== 0
                                                    ? prev
                                                    : sampleNumber;
                                            prev = 0;
                                        }
                                        numSamples.set(sampleNumber);
                                    }}
                                >
                                    {#each paramOptions as glyph}
                                        <option value={glyph}>{glyph}</option>
                                    {/each}
                                </select>

                                <label class="flex items-center gap-2">
                                    <span class="label-text">Add Primer</span>
                                    <input
                                        type="checkbox"
                                        bind:checked={addPrimer}
                                        class="toggle toggle-sm toggle-primary"
                                    />
                                </label>
                            {/if}

                            {#if strategy === "primer"}
                                <p class="text-sm font-medium">
                                    {#if sysexList.length > 0}
                                        {getNamefromConfig(
                                            sysexList[sysexIndex],
                                        )}
                                    {:else}
                                        <span class="italic text-gray-500"
                                            >No Primer available</span
                                        >
                                    {/if}
                                </p>
                            {/if}

                            <div class="flex gap-2">
                                <button
                                    class="btn btn-primary w-full"
                                    on:click={() =>
                                        sample(
                                            strategy,
                                            valueChange,
                                            paramChange,
                                        )}
                                >
                                    Sample
                                </button>
                                <button
                                    class="btn btn-secondary w-full"
                                    on:click={() =>
                                        doAnalysis(collection, $startingIndex)}
                                >
                                    Analyze
                                </button>
                            </div>
                        {/if}

                        {#if activesection === "visualization"}
                            <select
                                bind:value={pointColor}
                                class="select select-bordered w-full"
                            >
                                {#each colorOptions as color}
                                    <option value={color}>{color}</option>
                                {/each}
                            </select>
                            <select
                                bind:value={pointRenderer}
                                class="select select-bordered w-full"
                            >
                                {#each glyphOptions as glyph}
                                    <option value={glyph}>{glyph}</option>
                                {/each}
                            </select>
                            <button
                                class="btn btn-outline btn-warning w-full mt-2"
                                on:click={() => excluded.set([])}
                            >
                                Reset Excluded
                            </button>
                        {/if}

                        {#if activesection === "interpolation"}
                            <input
                                type="text"
                                bind:value={textInput}
                                maxlength="10"
                                placeholder="Config Name"
                                class="input input-bordered w-full"
                            />
                            <button
                                class="btn btn-primary w-full mt-2"
                                on:click={handleInterpolation}
                                >Add as Reference</button
                            >

                            <label class="flex items-center gap-2">
                                <span class="label-text">Send Whole</span>
                                <input
                                    type="checkbox"
                                    bind:checked={$sysexInterpolation}
                                    class="toggle toggle-sm toggle-primary"
                                />
                            </label>
                        {/if}

                        {#if activesection === "reference"}
                            <p class="text-sm">
                                {#if sysexList.length > 0 && sysexIndex >= 0}
                                    {getNamefromConfig(sysexList[sysexIndex])}
                                {:else}
                                    <span class="italic text-gray-500"
                                        >No Reference Selected</span
                                    >
                                {/if}
                            </p>
                            {#if sysexList.length > 0}
                                <button
                                    class="btn btn-primary w-full mt-1"
                                    on:click={handleReference}
                                    >Add as Reference</button
                                >
                            {/if}
                        {/if}

                        {#if activesection === "newWavFile"}
                            <input
                                type="file"
                                accept=".wav"
                                multiple
                                on:change={importWavFile}
                                class="file-input file-input-bordered w-full"
                            />
                        {/if}

                        {#if activesection === "export"}
                            <button
                                class="btn btn-outline w-full"
                                on:click={() => exportList.set([])}
                                >Reset Export List</button
                            >
                            <button
                                class="btn btn-primary w-full"
                                on:click={() => writeSysEx(exportList)}
                                >Export Config.syx</button
                            >
                            <button
                                class="btn btn-secondary w-full"
                                on:click={() => exportSession()}
                                >Export Session</button
                            >
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <footer
            class="p-4 bg-base-300 text-sm text-center text-gray-600 font-mono"
        >
            <TextView
                content="testOOD: {testOODtrigger} - points: {$data.length}"
                parameters={Object.entries(dx7Parameters)}
                configs={$jsonDataList.map((j) => j.config)}
            />
        </footer>
    </aside>

    <!-- Middle Map Card -->
    <main
        class="card bg-base-100 shadow-xl overflow-hidden flex items-center justify-center"
    >
        <MapView
            {pointRenderer}
            {pointColor}
            onPointClick={handlePointClick}
            {selectedPoint}
            {referencePoint}
            class="w-full h-full"
        />
    </main>

    <!-- Right Detail Card -->
    <aside class="card bg-base-100 shadow-xl p-4 overflow-auto">
        <DetailView {selectedPoint} />
    </aside>
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

    .active-tab {
        background-color: var(--color-primary); /* Light primary background */
    }

    .active-tab span {
        color: var(--color-primary-content);
        font-weight: 800;
        letter-spacing: 0.5px;
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
