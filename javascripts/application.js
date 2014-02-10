$(document).ready(function() {
  simulation.initialize();
  graph.initialize();
});

var config = {
  initialPopulationSize: 10000,
  initialBirthRate: 0.1,
  initialDeathRate: 0.02
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
    $('p[data-label="population-size"]').text(utilities.formatNumber(data.populationSize));
    $('p[data-label="birth-count"]').text(utilities.formatNumber(data.birthCount));
    $('p[data-label="birth-rate"]').text(utilities.formatPercentage(data.birthRate));
    $('p[data-label="death-count"]').text(utilities.formatNumber(data.deathCount));
    $('p[data-label="death-rate"]').text(utilities.formatPercentage(data.deathRate));
  }
};

var graph = {
  canvas: null,
  context: null,
  timestep: 0,
  initialize: function() {
    graph.canvas = document.getElementById('graph');
    graph.context = graph.canvas.getContext('2d');
    graph.canvas.width = $('.graph').width();
    graph.canvas.height = $('.graph').height();

    graph.context.strokeStyle = "#eeeeee";
    graph.context.moveTo(0, graph.canvas.height / 2);
    graph.context.lineTo(graph.canvas.width, graph.canvas.height / 2);
    graph.context.stroke();
    graph.context.moveTo(0, 0);
    graph.context.lineTo(0, graph.canvas.height);
    graph.context.stroke();

    $('.graph').attr('data-initial', utilities.formatNumber(config.initialPopulationSize));
  },
  plot: function(data) {
    
  }
};

var utilities = {
  formatNumber: function(number) {
    number = '' + number;
    if (number.length > 3) {
      var result = '';
      for (var i = number.length - 1, j = 0; i >= 0; i--, j++) {
        if (j == 3) {
          j = 0;
          result = ',' + result;
        }
        result = number.charAt(i) + result;
      }
      return result;
    }
    return number;
  },
  formatPercentage: function(percentage) {
    percentage = '' + percentage;
    var result = '';
    percentage = percentage.split('.');
    result += percentage.shift();
    if (percentage.length > 0) {
      result += '.' + percentage.shift().substring(0, 2);
    }
    return result + '%';
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
  },
  graph: function(data) {
    graph.plot(data);
  }
};