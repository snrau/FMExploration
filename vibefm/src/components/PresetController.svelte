<script>
    import { writable } from "svelte/store";

    // Define state variables
    let presets = [];
    let selectedIndex = 0;

    // Example functions for preset control
    export let save = () => {};
    export let reset = () => {};
    export let onChange = (event) => {};
</script>

<div>
    <select bind:value={selectedIndex} on:change={onChange}>
        {#each presets as preset, index}
            <option value={index}>{preset.name}</option>
        {/each}
    </select>
    <button on:click={save}>Save</button>
    <button on:click={reset}>Reset</button>
</div>
