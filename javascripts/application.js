$(document).ready(function() {
  simulation.initialize();
  graph.initialize();
});

var config = {
  initialPopulationSize: 10000,
  initialBirthRate: 0.1,
  initialDeathRate: 0.1
};

var simulation = {
  worker: null,
  initialize: function() {
    simulation.worker = new Worker('javascripts/simulation.js');
    simulation.worker.onmessage = function(message) {
      message = JSON.parse(message.data);
      if (message.hasOwnProperty('data')) {
        receiver[message.command](message.data);
      } else {
        receiver[message.command]();
      }
    }

    transmitter.transmit('initialize', config);
  },
  start: function() {
    transmitter.transmit('start');
  }
};

var stats = {
  update: function(data) {
    $('p[data-label="population-size"]').text(data.populationSize);
  }
};

var graph = {
  canvas: null,
  context: null,
  initialize: function() {
    graph.canvas = document.getElementById('graph');
    graph.context = graph.canvas.getContext('2d');
    graph.canvas.width = $('.graph').width();
    graph.canvas.height = $('.graph').height();
  }
};

var transmitter = {
  transmit: function(command, data) {
    var message = {command: command, data: data};
    simulation.worker.postMessage(JSON.stringify(message));
  }
};

var receiver = {
  log: function(data) {
    console.log(data);
  },
  initialized: function() {
    simulation.start();
  },
  stat: function(data) {
    stats.update(data);
  }
};