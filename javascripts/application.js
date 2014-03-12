$(document).ready(function() {
  simulation.initialize();
  graph.initialize();
});

var config = {
  simulation: {
    initialPopulation: [
      {minAge: 0, maxAge: 0, males: 115, females: 109},
      {minAge: 1, maxAge: 4, males: 461, females: 443},
      {minAge: 5, maxAge: 9, males: 544, females: 520},
      {minAge: 10, maxAge: 14, males: 533, females: 511},
      {minAge: 15, maxAge: 19, males: 488, females: 476},
      {minAge: 20, maxAge: 24, males: 430, females: 430},
      {minAge: 25, maxAge: 29, males: 379, females: 384},
      {minAge: 30, maxAge: 34, males: 330, females: 327},
      {minAge: 35, maxAge: 39, males: 302, females: 296},
      {minAge: 40, maxAge: 44, males: 264, females: 256},
      {minAge: 45, maxAge: 49, males: 223, females: 218},
      {minAge: 50, maxAge: 54, males: 175, females: 172},
      {minAge: 55, maxAge: 59, males: 134, females: 136},
      {minAge: 60, maxAge: 64, males: 93, females: 98},
      {minAge: 65, maxAge: 69, males: 72, females: 83},
      {minAge: 70, maxAge: 100, males: 95, females: 127}
    ],
    birthRate: 0.3,
    deathRate: 0.05,
    immigrationRate: 0.0,
    emmigrationRate: 0.0
  },
  graph: {
    maxPopulationSize: 150000, 
    verticalSegments: 10
  }
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

    transmitter.transmit('initialize', config.simulation);
  },
  start: function() {
    transmitter.transmit('start');
  }
};

var stats = {
  update: function(data) {
    $('p[data-label="population-size"]').text(utilities.formatNumber(data.populationSize));
    $('p[data-label="birth-count"]').text(utilities.formatNumber(data.birthCount));
    // $('p[data-label="birth-rate"]').text(utilities.formatPercentage(data.birthRate));
    $('p[data-label="death-count"]').text(utilities.formatNumber(data.deathCount));
    // $('p[data-label="death-rate"]').text(utilities.formatPercentage(data.deathRate));
    $('p[data-label="immigrants"]').text(utilities.formatNumber(data.immigrations));
    // $('p[data-label="immigration-rate"]').text(utilities.formatPercentage(data.immigrationRate));
    $('p[data-label="emmigrants"]').text(utilities.formatNumber(data.emmigrations));
    // $('p[data-label="emmigration-rate"]').text(utilities.formatPercentage(data.emmigrationRate));
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

    graph.context.strokeStyle = '#eeeeee';
    var interval = Math.floor(config.graph.maxPopulationSize / config.graph.verticalSegments);
    var currentSegment = 0;
    var dashWidth = 10;
    var dashSpacing = 5;
    for (var i = 0; i <= config.graph.verticalSegments; i++) {
      var coordinates = graph.convert(0, currentSegment);
      for (var j = 0; j < graph.canvas.width; j += dashWidth + dashSpacing) {
        graph.context.beginPath();
        graph.context.moveTo(j, coordinates.y);
        graph.context.lineTo(j + dashWidth, coordinates.y);
        graph.context.stroke();
      }
      var label = $('<span>' + utilities.formatNumber(currentSegment) + '</span>');
      $('.segment-labels').append(label);
      label.css({'top': coordinates.y + 'px'});
      currentSegment += interval;
    }

    graph.previousPoint = graph.convert(0, config.simulation.initialPopulationSize);
  },
  plot: function(data) {
    graph.timestep += 3;
    var container = $('.graph-container');
    if (graph.timestep > graph.canvas.width) {
      transmitter.transmit('stop');
    } else if (graph.timestep > container.width()) {
      container.width(container.width() + 3);
      $('.viewport').scrollLeft(container.width());
    }

    var coordinates = graph.convert(graph.timestep, data.populationSize);
    graph.context.strokeStyle = "#333333";
    graph.context.beginPath();
    graph.context.moveTo(graph.previousPoint.x, graph.previousPoint.y);
    graph.context.lineTo(graph.timestep, coordinates.y);
    graph.context.stroke();

    graph.previousPoint = coordinates;
  },
  convert: function(x, y) {
    var ratio = y / config.graph.maxPopulationSize;
    return {x: x, y: graph.canvas.height - graph.canvas.height * ratio};
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