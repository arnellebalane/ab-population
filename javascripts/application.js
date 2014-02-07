var config = {
  initialPopulationSize: 100
};

$(document).ready(function() {
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

var simulation = {
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