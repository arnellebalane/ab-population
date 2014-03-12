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
  population: {},
  interval: null,
  initialize: function(config) {
    simulation.config = config;
    simulation.environment = new Environment(config);
    simulation.population.people = [];
    simulation.population.size = 0;
    simulation.population.males = 0;
    simulation.population.females = 0;
    simulation.population.births = 0;
    simulation.population.deaths = 0;
    simulation.population.immigrations = 0;
    simulation.population.emmigrations = 0;
    for (var i = 0; i < config.initialPopulation.length; i++) {
      var ageGroup = config.initialPopulation[i];
      for (var j = 0; j < ageGroup.males; j++) {
        var person = new Person({gender: 'male', age: utilities.random(ageGroup.minAge, ageGroup.maxAge)});
        simulation.population.people.push(person);
      }
      for (var j = 0; j < ageGroup.females; j++) {
        var person = new Person({gender: 'female', age: utilities.random(ageGroup.minAge, ageGroup.maxAge)});
        simulation.population.people.push(person);
      }
    }
    stats.update();

    transmitter.transmit('initialized');
  },
  start: function() {
    simulation.interval = setInterval(function() {
      simulation.population.births = 0;
      simulation.population.deaths = 0;
      simulation.population.immigrations = 0;
      simulation.population.emmigrations = 0;
      simulation.timestep();
    }, 10);
  },
  stop: function() {
    clearInterval(simulation.interval);
  },
  timestep: function() {
    simulation.environment.calculateProbabilities();
    simulation.environment.takeChances();

    var removeables = [];
    simulation.population.size = simulation.population.people.length;
    for (var i = 0, size = simulation.population.size; i < size; i++) {
      var person = simulation.population.people[i];
      person.growOld();
      person.calculateProbabilities();
      person.takeChances();
      if (!person.keep) {
        removeables.push(i);
      }
    }
    while (removeables.length > 0) {
      simulation.population.people.splice(removeables.pop(), 1);
    }
    stats.update();

    if (simulation.population.size == 0) {
      simulation.stop();
    }
  }
};

var stats = {
  update: function() {
    var stat = {
      populationSize: stats.populationSize(),
      birthCount: stats.birthCount(),
      birthRate: stats.birthRate(),
      deathCount: stats.deathCount(),
      deathRate: stats.deathRate(),
      immigrations: stats.immigrations(),
      immigrationRate: stats.immigrationRate(),
      emmigrations: stats.emmigrations(),
      emmigrationRate: stats.emmigrationRate()
    };
    transmitter.transmit('stat', stat);
    transmitter.transmit('graph', stat);
  },
  populationSize: function() {
    return simulation.population.people.length;
  },
  birthCount: function() {
    return simulation.population.births;
  },
  birthRate: function() {
    var rate = simulation.population.births / simulation.population.females * 100;
    return (isNaN(rate)) ? 0 : rate;
  },
  deathCount: function() {
    return simulation.population.deaths;
  },
  deathRate: function() {
    var rate = simulation.population.deaths / simulation.population.size * 100;
    return (isNaN(rate)) ? 0 : rate;
  },
  immigrations: function() {
    return simulation.population.immigrations;
  },
  immigrationRate: function() {
    var rate = simulation.population.immigrations / simulation.population.size * 100;
    return (isNaN(rate)) ? 0 : rate;
  },
  emmigrations: function() {
    return simulation.population.emmigrations;
  },
  emmigrationRate: function() {
    var rate = simulation.population.emmigrations / simulation.population.size * 100;
    return (isNaN(rate)) ? 0 : rate;
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
    death: config.deathRates,
    immigration: config.immigrationRate,
    emmigration: config.emmigrationRate
  };
  this.probabilities = {
    emmigrate: {
      calculate: function() {
        return simulation.environment.rates.emmigration;
      },
      execute: function() {
        var emmigrants = Math.random() * 100;
        for (var i = 0; i < emmigrants; i++) {
          var emmigrant = new Person();
          simulation.population.people.push(emmigrant);
          simulation.population.emmigrations++;
        }
      }
    }
  };

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

function Person(config) {
  var _this = this;
  this.keep = true;
  this.age = (config && typeof config == 'object' && 'age' in config) ? config.age : 0;
  this.gender = (config && typeof config == 'object' && 'gender' in config) ? config.gender : ['male', 'female'][Math.floor(Math.random() * 10) % 2];

  simulation.population[this.gender + 's']++;

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
        simulation.population[_this.gender + 's']--;
        simulation.population.deaths++;
        _this.keep = false;
      }
    },
    giveBirth: {
      calculate: function() {
        return (_this.gender == 'male' || _this.age < 15 || _this.age > 49) ? 0 : simulation.environment.rates.birth;
      },
      execute: function() {
        var child = new Person();
        simulation.population.people.push(child);
        simulation.population.births++;
      }
    },
    migrate: {
      calculate: function() {
        return simulation.environment.rates.immigration;
      },
      execute: function() {
        simulation.population[_this.gender + 's']--;
        simulation.population.immigrations++;
        _this.keep = false;
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