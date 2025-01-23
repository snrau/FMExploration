<script>
  import SideMenu from "./components/SideMenu.svelte";
  import DexedConnectionView from "./views/DexedConnection.svelte";

  import Overview from "./components/Overview.svelte";
  import { onMount } from "svelte";
  import { requestMidiAccess } from "./utils/midi";

  let currentView = "about";

  function handleNavigation(view) {
    currentView = view;
  }

  onMount(() => {
    requestMidiAccess();
  });
</script>

<div class="app-container">
  <SideMenu callback={handleNavigation} />
  <div class="main-content">
    {#if currentView === "synth"}
      <Overview />
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
