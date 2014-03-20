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
  interval: null,
  initialize: function(config) {
    simulation.config = config;
    simulation.environment = new Environment(config);
    simulation.environment.population.people = [];
    simulation.environment.population.births = 0;
    simulation.environment.population.deaths = 0;
    for (var i = 0; i < config.initialPopulation.length; i++) {
      var ageGroup = config.initialPopulation[i];
      for (var j = 0; j < ageGroup.males; j++) {
        var person = new Person({gender: 'male', age: utilities.random(ageGroup.minAge, ageGroup.maxAge)});
        simulation.environment.population.people.push(person);
      }
      for (var j = 0; j < ageGroup.females; j++) {
        var person = new Person({gender: 'female', age: utilities.random(ageGroup.minAge, ageGroup.maxAge)});
        simulation.environment.population.people.push(person);
      }
    }
    stats.update();

    transmitter.transmit('initialized');
  },
  start: function() {
    simulation.interval = setInterval(function() {
      simulation.environment.population.births = 0;
      simulation.environment.population.deaths = 0;
      simulation.timestep();
    }, 10);
  },
  stop: function() {
    clearInterval(simulation.interval);
  },
  timestep: function() {
    simulation.environment.timestep();
    stats.update();
    if (simulation.environment.population.size == 0) {
      simulation.stop();
    }
  }
};

var stats = {
  update: function() {
    var stat = {
      populationSize: stats.populationSize(),
      birthCount: stats.birthCount(),
      deathCount: stats.deathCount()
    };
    transmitter.transmit('stat', stat);
    transmitter.transmit('graph', stat);
  },
  populationSize: function() {
    return simulation.environment.population.people.length;
  },
  birthCount: function() {
    return simulation.environment.population.births;
  },
  deathCount: function() {
    return simulation.environment.population.deaths;
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
  },
  stop: function() {
    simulation.stop();
  }
};

var utilities = {
  random: function(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
};



function Environment(config) {
  this.rates = {
    birth: config.birthRate,
    death: config.deathRates
  };
  this.population = {};

  this.timestep = function() {
    var removeables = [];
    for (var i = 0, size = this.population.people.length; i < size; i++) {
      var person = this.population.people[i];
      person.growOld();
      person.calculateProbabilities();
      person.takeChances();
      if (!person.alive) {
        removeables.push(i);
      }
    }
    while (removeables.length > 0) {
      this.population.people.splice(removeables.pop(), 1);
    }
  }
}

function Person(config) {
  var _this = this;
  this.alive = true;
  this.age = (config && typeof config == 'object' && 'age' in config) ? config.age : 0;
  this.gender = (config && typeof config == 'object' && 'gender' in config) ? config.gender : ['male', 'female'][Math.floor(Math.random() * 10) % 2];

  simulation.environment.population[this.gender + 's']++;

  this.probabilities = {
    die: {
      calculate: function() {
        for (var i = 0; i < simulation.environment.rates.death.length; i++) {
          var rate = simulation.environment.rates.death[i];
          if (_this.age >= rate.minAge && _this.age <= rate.maxAge) {
            return rate[_this.gender + 's'];
          }
        }
        return 1;
      },
      execute: function() {
        simulation.environment.population[_this.gender + 's']--;
        simulation.environment.population.deaths++;
        _this.alive = false;
      }
    },
    giveBirth: {
      calculate: function() {
        return (_this.gender == 'male' || _this.age < 15 || _this.age > 49) ? 0 : simulation.environment.rates.birth;
      },
      execute: function() {
        var child = new Person();
        simulation.environment.population.people.push(child);
        simulation.environment.population.births++;
      }
    }
  };

  this.growOld = function() {
    this.age++;
  }
  this.calculateProbabilities = function() {
    var ceil = 0;
    for (probability in this.probabilities) {
      var chance = this.probabilities[probability].calculate();
      this.probabilities[probability].min = ceil;
      this.probabilities[probability].max = ceil + chance;
      ceil += chance;
    }
  }
  this.takeChances = function() {
    var chance = Math.random();
    for (probability in this.probabilities) {
      if (chance >= this.probabilities[probability].min && chance < this.probabilities[probability].max) {
        this.probabilities[probability].execute();
        break;
      }
    }
  }
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