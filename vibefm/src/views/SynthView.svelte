<script>
    import { onMount, onDestroy } from "svelte";
    import angular from "angular";
    import "../existingSynth/src/app.js";

    if (!window.angular) {
        window.angular = angular;
    }

    let angularAppElement; // Reference to the div where AngularJS will mount

    onMount(async () => {
        // Assume `angular` is globally available
        if (window.angular) {
            window.angular.bootstrap(angularAppElement, [
                "yourAngularAppModule",
            ]);
        }
    });

    onDestroy(() => {
        if (angularAppElement) {
            // Clean up AngularJS instance
            angular
                .element(angularAppElement)
                .injector()
                .get("$rootScope")
                .$destroy();
        }
    });
</script>

<div bind:this={angularAppElement}>
    <!-- AngularJS will mount here -->
</div>
