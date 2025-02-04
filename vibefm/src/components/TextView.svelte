<script>
  import ConfigHistogram from "./ConfigHistogram.svelte";
  import ConfigIntensity from "./ConfigIntensity.svelte";

  export let title = "Title";
  export let content = "Content";
  export let parameters = null;
  export let configs = null;
</script>

<div class="container">
  <div class="small-view">
    <h3>{title}</h3>
    <p>{content}</p>
  </div>

  <div class="config-container">
    {#if parameters && configs}
      <ConfigHistogram {parameters} {configs} binnumber={7}></ConfigHistogram>
      <ConfigIntensity {parameters} {configs} binnumber={7}></ConfigIntensity>
    {/if}
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .small-view {
    border: 1px solid #ccc;
    padding: 10px;
    background-color: #ffffff;
    color: #000;
    max-width: 600px;
  }

  h3 {
    margin: 0 0 10px;
  }

  .config-container {
    padding: 10px;
    margin-top: 20px;
    max-width: 300px;
  }
</style>
