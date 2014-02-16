$(document).ready(function() {
  simulation.initialize();
  graph.initialize();
});

var config = {
  initialPopulationSize: 1000,
  initialBirthRate: 0.1,
  initialDeathRate: 0.01,
  initialImmigrationRate: 0.05,
  initialEmmigrationRate: 0.5,
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
    $('p[data-label="immigrants"]').text(utilities.formatNumber(data.immigrations));
    $('p[data-label="immigration-rate"]').text(utilities.formatPercentage(data.immigrationRate));
    $('p[data-label="emmigrants"]').text(utilities.formatNumber(data.emmigrations));
    $('p[data-label="emmigration-rate"]').text(utilities.formatPercentage(data.emmigrationRate));
  }
};

var graph = {
  canvas: null,
  context: null,
  timestep: -3,
  previousPoint: {},
  initialize: function() {
    graph.canvas = document.getElementById('graph');
    graph.context = graph.canvas.getContext('2d');
    graph.canvas.width = $('.viewport').width() * 10;
    graph.canvas.height = $('.viewport').height();

    graph.context.strokeStyle = "#eeeeee";
    graph.context.beginPath();
    graph.context.moveTo(0, graph.canvas.height / 2);
    graph.context.lineTo(graph.canvas.width, graph.canvas.height / 2);
    graph.context.stroke();
    graph.context.moveTo(0, graph.canvas.height);
    graph.context.lineTo(graph.canvas.width, graph.canvas.height);
    graph.context.stroke();

    graph.previousPoint = {x: 0, y: graph.canvas.height / 2};

    $('.graph').attr('data-initial', utilities.formatNumber(config.initialPopulationSize));
  },
  plot: function(data) {
    var ratio = data.populationSize / (2 * config.initialPopulationSize);
    var y = graph.canvas.height - graph.canvas.height * ratio;

    graph.timestep += 3;
    var container = $('.graph-container');
    if (graph.timestep > graph.canvas.width) {
      transmitter.transmit('stop');
    } else if (graph.timestep > container.width()) {
      container.width(container.width() + 3);
      $('.viewport').scrollLeft(container.width());
    }

    graph.context.strokeStyle = "#333333";
    graph.context.beginPath();
    graph.context.moveTo(graph.previousPoint.x, graph.previousPoint.y);
    graph.context.lineTo(graph.timestep, y);
    graph.context.stroke();

    graph.previousPoint = {x: graph.timestep, y: y};
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