<script>
    // @ts-nocheck

    import { onMount, onDestroy } from "svelte";

    let angularHtml = "";
    let scriptLoaded = false;

    // Function to dynamically load the bundle.js script
    const loadAngularAppScript = () => {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "./src/views/bundle.js"; // Path to your AngularJS bundle.js
            script.onload = () => {
                console.log("AngularJS bundle loaded");
                resolve();
            };
            script.onerror = (err) => reject(err);
            document.body.appendChild(script);
        });
    };

    onMount(async () => {
        try {
            //Step 1
            const res = await fetch("./src/existingSynth/synth.html");
            angularHtml = await res.text();
            console.log("C1");

            //Step 2
            const container = document.getElementById("angular-app-container");
            container.innerHTML = angularHtml;
            console.log("C2");

            //Step 3
            await loadAngularAppScript();
            console.log("C3");

            //Step 4
            setTimeout(() => {
                console.log("C4");
                // Assume `angular` is globally available
                const appElement = document.getElementById(
                    "angular-app-container",
                );
                if (window.angularApp && appElement) {
                    window.angular.bootstrap(appElement, [
                        window.angularApp.name,
                    ]);
                    window.angular
                        .element(document.getElementById("angular-container"))
                        .scope()
                        .$digest();
                }
            }, 2000);
        } catch (e) {
            console.log(e);
        }
    });
    onDestroy(() => {
        // Optionally, you can clean up AngularJS or other related stuff here
        const appElement = document.getElementById("angular-app-container");
        if (appElement) {
            window.angular.element(appElement).scope().$destroy();
        }
    });
</script>

<div
    id="angular-app-container"
    ng-app="synthApp"
    ng-controller="MidiCtrl as midiCtrl"
>
    <!-- AngularJS will mount here -->
</div>
