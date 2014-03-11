$(document).ready(function() {
  simulation.initialize();
});

var simulation = {
  server: null, 
  initialize: function() {
    simulation.server = new EventSource('server/simulation.php');
    simulation.server.onmessage = simulation.update;
  },
  update: function(e) {
    console.log(e);
  }
};