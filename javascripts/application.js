var config = {
  initialPopulationSize: 10000
};

$(document).ready(function() {
  simulation.initialize();
  world.initialize();
  agents.initialize();
  graph.initialize();
});

var world = {
  environment: null,
  initialize: function() {
    world.environment = new Environment();
    world.environment.run();
  }
};

var agents = {
  people: [],
  initialize: function() {
    for (var i = 0; i < config.initialPopulationSize; i++) {
      var person = new Person();
      agents.people.push(person);
    }
    stats.updatePopulationSize();
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

var stats = {
  update: function() {
    stats.updatePopulationSize();
  },
  updatePopulationSize: function() {
    var populationSize = utilities.formatNumber(agents.people.length);
    $('p[data-label="population-size"]').text(populationSize);
  }
};

var utilities = {
  formatNumber: function(number) {
    number = '' + number;
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
};

var simulation = {
  initialize: function() {
    document.addEventListener('timestep', stats.update);
  },
  dispatch: function(event) {
    document.dispatchEvent(event);
  }
};



function Environment() {
  this.run = function() {
    setInterval(function() {
      var event = new Event('timestep');
      simulation.dispatch(event);
    }, 1000);
  }
}

function Person() {
  this.age = 0;
  this.gender = ['male', 'female'][Math.floor(Math.random() * 10) % 2];

  (function(person) {
    person.growOld = function() {
      person.age++;
    }
    person.respond = function() {
      person.growOld();
    }

    document.addEventListener('timestep', person.respond);
  })(this);
}

function Event(name, properties) {
  var event = new CustomEvent(name);
  if (properties) {
    for (property in properties) {
      event[property] = properties[property];
    }
  }
  return event;
}