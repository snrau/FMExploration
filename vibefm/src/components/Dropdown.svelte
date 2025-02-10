<script>
    export let options = [];
    export let onOptionClick; // Function to call when an option is clicked

    let isOpen = false;

    function toggleMenu() {
        isOpen = !isOpen;
    }

    function handleClick(option) {
        if (onOptionClick) {
            onOptionClick(option);
        }
        isOpen = false; // Close the menu after selection
    }
</script>

<div class="dropdown">
    <button class="dropdown-button" on:click={toggleMenu}> Menu </button>

    <div class="dropdown-menu {isOpen ? 'open' : ''}">
        {#each options as option}
            <div class="dropdown-item" on:click={() => handleClick(option)}>
                {option}
            </div>
        {/each}
    </div>
</div>

<style>
    .dropdown {
        position: relative;
        display: inline-block;
    }

    .dropdown-button {
        padding: 10px;
        background-color: #007bff;
        color: rgb(129, 43, 43);
        border: none;
        color: white;
        border-radius: 4px;
        cursor: pointer;
    }

    .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        background-color: rgb(148, 39, 39);
        border: 1px solid #ccc;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        z-index: 1000;
        width: 150px;
        display: none;
    }

    .dropdown-menu.open {
        display: block;
    }

    .dropdown-item {
        padding: 10px;
        cursor: pointer;
        text-align: left;
        background-color: rgb(163, 59, 59);
        border-bottom: 1px solid #f0f0f0;
    }

    .dropdown-item:hover {
        background-color: #007bff;
        color: rgb(150, 55, 55);
    }

    .dropdown-item:last-child {
        border-bottom: none;
    }
</style>
