<script>
    // @ts-nocheck

    import { onMount, onDestroy } from "svelte";

    import "../existingSynth/synth.css";

    let angularHtml = "";

    // Function to dynamically load the bundle.js script
    const loadAngularAppScript = () => {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "./src/existingSynth/src/bundle.js"; // Path to your AngularJS bundle.js
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

            //Step 2
            const container = document.getElementById("angular-app-container");
            container.innerHTML = angularHtml;

            if (!window.scriptLoaded)
                //Step 3
                await loadAngularAppScript();

            //Step 4
            setTimeout(() => {
                // Assume `angular` is globally available
                const appElement = document.getElementById(
                    "angular-app-container",
                );
                if (appElement) {
                    window.angular.bootstrap(appElement, ["synthApp"]);
                    window.scriptLoaded = true;
                    window.angular
                        .element(
                            document.getElementById("angular-app-container"),
                        )
                        .scope()
                        .$digest();
                }
            }, 100);
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
