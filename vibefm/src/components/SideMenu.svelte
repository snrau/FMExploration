<script>
    import { createEventDispatcher } from "svelte";

    export let callback;
</script>

<aside class="sidebar">
    <nav>
        <h2>VibeFM</h2>
        <button on:click={() => callback("synth")}>Exploration</button>
        <button on:click={() => callback("about")}>Functions</button>
    </nav>
</aside>

<style>
    /* Sidebar styling */
    .sidebar {
        background-color: #2c3e50;
        color: #ffffff;
        width: 100%;
        max-width: 200px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .sidebar nav {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .sidebar button {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 1rem;
        padding: 0.5rem;
        text-align: left;
    }

    .sidebar button:hover {
        background-color: #34495e;
    }
</style>
