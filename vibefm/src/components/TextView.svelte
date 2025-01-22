<script>
    export let title = "Title";
    export let content = "Content";
  </script>
  
  <style>
    .small-view {
      border: 1px solid #ccc;
      padding: 10px;
      background-color: #5e5e5e;
    }
  
    h3 {
      margin: 0 0 10px;
    }
  </style>
  
  <div class="small-view">
    <h3>{title}</h3>
    <p>{content}</p>
  </div>