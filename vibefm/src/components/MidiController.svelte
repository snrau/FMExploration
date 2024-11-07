<script>
    // All functions related to MIDI handling
    export let onVizClick = () => {};
    export let onDemoClick = (demo) => {};
    export let onMidiPlay = () => {};
    export let onMidiStop = () => {};
</script>

<div>
    <!-- MIDI Buttons -->
    <button class="dx7-button purple" on:click={onVizClick}>Viz</button>
    <button class="dx7-button teal" on:click={() => onDemoClick(0)}
        >Demo 1</button
    >
    <button class="dx7-button teal" on:click={() => onDemoClick(1)}
        >Demo 2</button
    >
    <button class="dx7-button teal" on:click={onMidiPlay}>Play</button>
    <button class="dx7-button teal" on:click={onMidiStop}>Stop</button>

    <!-- MIDI Device Selection -->
    MIDI Device: <select class="dx7-button" id="midiIn"></select>
</div>
