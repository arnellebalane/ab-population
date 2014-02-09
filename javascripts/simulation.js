onmessage = function(message) {
  message = JSON.parse(message.data);
  if (message.hasOwnProperty('data')) {
    receiver[message.command](message.data);
  } else {
    receiver[message.command]();
  }
}

var simulation = {
  config: {},
  environment: null,
  population: [],
  initialize: function(config) {
    simulation.config = config;
    simulation.environment = new Environment(config);
    for (var i = 0; i < config.initialPopulationSize; i++) {
      var person = new Person();
      simulation.population.push(person);
    }
    stats.update();

    transmitter.transmit('initialized');
  },
  start: function() {
    transmitter.transmit('log', 'starting...');
  }
};

var stats = {
  update: function() {
    var stat = {
      populationSize: stats.populationSize()
    };
    transmitter.transmit('stat', stat);
  },
  populationSize: function() {
    return utilities.formatNumber(simulation.population.length);
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

var transmitter = {
  transmit: function(command, data) {
    var message = {command: command, data: data};
    postMessage(JSON.stringify(message));
  }
};

var receiver = {
  initialize: function(config) {
    simulation.initialize(config);
  },
  start: function() {
    simulation.start();
  }
};



function Environment(config) {
  this.rates = {
    birth: config.initialBirthRate,
    death: config.initialDeathRate
  };

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
  this.probabilities = {
    die: {
      calculate: function() {
        return 1 - Math.pow(Math.E, -world.environment.rates.death);
      },
      execute: function() {
        console.log('died');
      }
    },
    giveBirth: {
      calculate: function() {
        return 1 - Math.pow(Math.E, -world.environment.rates.birth);
      },
      execute: function() {
        var child = new Person();
        agents.people.push(child);
      }
    }
  };
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