<script>
    import { onMount, onDestroy } from "svelte";

    onMount(() => {
        const angularContainer = document.getElementById(
            "angular-app-container",
        );

        // Show the AngularJS app when SynthView is active
        if (angularContainer) angularContainer.style.display = "block";
    });

    onDestroy(() => {
        const angularContainer = document.getElementById(
            "angular-app-container",
        );

        // Hide the AngularJS app when SynthView is inactive
        if (angularContainer) angularContainer.style.display = "none";
    });
</script>
