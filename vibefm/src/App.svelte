<script>
  import SideMenu from "./components/SideMenu.svelte";
  import DexedConnectionView from "./views/DexedConnection.svelte";

  import "./existingSynth/synth.css";

  let currentView = "about";

  function handleNavigation(view) {
    currentView = view;
  }
</script>

<div class="app-container">
  <SideMenu callback={handleNavigation} />
  <div class="main-content">
    {#if currentView === "synth"}
      <p />
    {:else if currentView === "about"}
      <DexedConnectionView />
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
