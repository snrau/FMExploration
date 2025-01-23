<script>
  export let title = "Title";
  export let content = "Content";
</script>

<div class="small-view">
  <h3>{title}</h3>
  <p>{content}</p>
</div>

<style>
  .small-view {
    border: 1px solid #ccc;
    padding: 10px;
    background-color: #ffffff;
    color: #000;
  }

  h3 {
    margin: 0 0 10px;
  }
</style>
