<script>
  import SideMenu from "./components/SideMenu.svelte";
  import SynthView from "./views/SynthView.svelte";
  import AboutView from "./views/ExpView.svelte";

  import "./existingSynth/synth.css";

  let currentView = "synth";

  function handleNavigation(view) {
    currentView = view;
  }
</script>

<div class="app-container">
  <SideMenu callback={handleNavigation} />
  <div class="main-content">
    {#if currentView === "synth"}
      <SynthView />
    {:else if currentView === "about"}
      <AboutView />
    {/if}
  </div>
</div>

<style>
  .app-container {
    display: flex;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }
  .main-content {
    flex-grow: 1;
    overflow: hidden;
  }
</style>
