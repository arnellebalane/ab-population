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
  initialize: function(config) {
    simulation.config = config;
    simulation.environment = new Environment(config);
    simulation.population.people = [];
    simulation.population.size = 0;
    simulation.population.males = 0;
    simulation.population.females = 0;
    simulation.population.births = 0;
    simulation.population.deaths = 0;
    for (var i = 0; i < config.initialPopulationSize; i++) {
      var person = new Person();
      simulation.population.people.push(person);
    }
    stats.update();

    transmitter.transmit('initialized');
  },
  start: function() {
    setInterval(function() {
      simulation.population.births = 0;
      simulation.population.deaths = 0;
      simulation.timestep();
    }, 1000);
  },
  timestep: function() {
    var dead = [];
    simulation.population.size = simulation.population.people.length;
    for (var i = 0, size = simulation.population.size; i < size; i++) {
      var person = simulation.population.people[i];
      person.growOld();
      person.calculateProbabilities();
      person.takeChances();
      if (!person.alive) {
        dead.push(i);
      }
    }
    simulation.population.deaths = dead.length;
    while (dead.length > 0) {
      simulation.population.people.splice(dead.pop(), 1);
    }
    stats.update();
  }
};

var stats = {
  update: function() {
    var stat = {
      populationSize: stats.populationSize(),
      birthCount: stats.birthCount(),
      birthRate: stats.birthRate(),
      deathCount: stats.deathCount(),
      deathRate: stats.deathRate()
    };
    transmitter.transmit('stat', stat);
    transmitter.transmit('graph', stat);
  },
  populationSize: function() {
    return utilities.formatNumber(simulation.population.people.length);
  },
  birthCount: function() {
    return utilities.formatNumber(simulation.population.births);
  },
  birthRate: function() {
    var rate = simulation.population.births / simulation.population.females * 100;
    return utilities.formatPercentage((isNaN(rate)) ? 0 : rate);
  },
  deathCount: function() {
    return utilities.formatNumber(simulation.population.deaths);
  },
  deathRate: function() {
    var rate = simulation.population.deaths / simulation.population.size * 100;
    return utilities.formatPercentage((isNaN(rate)) ? 0 : rate);
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
  var _this = this;
  this.alive = true;
  this.age = Math.floor(Math.random() * 50);
  this.gender = ['male', 'female'][Math.floor(Math.random() * 10) % 2];

  simulation.population[this.gender + 's']++;

  this.probabilities = {
    die: {
      calculate: function() {
        return 1 - Math.pow(Math.E, -simulation.environment.rates.death);
      },
      execute: function() {
        simulation.population[_this.gender + 's']--;
        _this.alive = false;
      }
    },
    giveBirth: {
      calculate: function() {
        return (_this.gender == 'male' || _this.age < 16 || _this.age > 45) ? 0 : 1 - Math.pow(Math.E, -simulation.environment.rates.birth);
      },
      execute: function() {
        var child = new Person();
        simulation.population.people.push(child);
        simulation.population.births++;
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