/* eslint no-var: 0 */
/* globals describe,commonSpec,it,expect,beforeEach */
/* jshint varstmt: false */
'use strict';

describe('Exotic', function() {
  let spec = {};

  commonSpec(spec);

  beforeEach(function () {
    spec.data.constants = {
      'INFUSE_POWER': 0.01,
      'EXOTIC_START': 1e6,
      'EXOTIC_STEP': 10
    };
    spec.state.registerUpdate('exotic', spec.exotic.upgrade);
  });

  describe('prestige', function() {
    it('should produce prestige currency', function() {
      spec.data.elements.H = {
        exotic:'xH',
        includes: ['1H']
      };
      spec.data.resources = {
        '1H': {elements: {H: 1}, type: ['isotope']}
      };
      spec.state.player.resources['1H'] = {number:5e8, unlocked: true};
      spec.state.player.statistics.exotic_run = {H:{}};
      spec.state.player.statistics.exotic_run.H['1H'] = 5e8;
      spec.state.player.element_slots = [{
        element: 'H'
      }];

      spec.exotic.update(spec.state.player);
      let production = spec.exotic.productionSum('H');

      expect(production).toEqual({'xH': 75});
    });

    it('should not produce prestige currency for small quantities', function() {
      spec.data.elements.H = {
        exotic:'xH',
        includes: ['1H']
      };
      spec.data.resources = {
        '1H': {elements: {H: 1}, type: ['isotope']}
      };
      spec.state.player.resources['1H'] = {number:1e5, unlocked: true};
      spec.state.player.statistics.exotic_run = {H:{}};
      spec.state.player.statistics.exotic_run.H['1H'] = 1e5;
      spec.state.player.element_slots = [{
        element: 'H'
      }];

      spec.exotic.update(spec.state.player);
      let production = spec.exotic.productionSum('H');

      expect(production).toEqual({'xH': 0});
    });

    it('should produce dual currency for compounds', function() {
      spec.data.elements.H = {
        exotic:'xH',
        includes: ['1H', 'H2O']
      };
      spec.data.elements.O = {
        exotic:'xO',
        includes: ['H2O']
      };
      spec.data.resources = {
        '1H': {elements: {H: 1}, type: ['isotope']},
        'H2O': {elements: {H: 2, O: 1}, type: ['molecule']}
      };
      spec.state.player.resources['1H'] = {number:0, unlocked: true};
      spec.state.player.resources.H2O = {number:5e8, unlocked: true};
      spec.state.player.statistics.exotic_run = {H:{},O:{}};
      spec.state.player.statistics.exotic_run.H['1H'] = 0;
      spec.state.player.statistics.exotic_run.H.H2O = 5e8;
      spec.state.player.statistics.exotic_run.O.H2O = 5e8;
      spec.state.player.element_slots = [{
        element: 'H'
      }];

      spec.exotic.update(spec.state.player);
      let production = spec.exotic.productionSum('H');

      expect(production).toEqual({'xH': 100, 'xO': 75});
    });

    it('should prestige', function() {
      spec.data.element_slot = {
        upgrades: {
          '1-1': false
        },
        generators: {
          '1': 0,
          '2': 0
        },
        reactions: [],
        redoxes: []
      };
      spec.data.elements.H = {
        exotic:'xH',
        includes: ['1H'],
        reactions: ['H.OH-H2O']
      };
      spec.data.resources = {
        '1H': {elements: {H: 1}, type: ['isotope']}
      };
      spec.state.player.resources['1H'] = {number:5e8, unlocked: true};
      spec.state.player.resources.xH = {number:0, unlocked: false};
      spec.state.player.statistics.exotic_run = {H:{}};
      spec.state.player.statistics.exotic_run.H['1H'] = 5e8;
      spec.state.player.elements.H = true;
      spec.state.player.exotic_upgrades = {
        H: {
          x3: true
        }
      };
      spec.state.player.element_slots = [{
        element: 'H',
        upgrades: {
          '1-1': true
        },
        generators: {
          '1': 99,
          '2': 99
        },
        reactions: [{
          active: true,
          reaction: ['H.OH-H2O']
        }],
        redoxes: []
      }];

      spec.exotic.update(spec.state.player);
      spec.exotic.exoticPrestige(0);

      expect(spec.state.player.element_slots[0]).toBeNull();
      expect(spec.state.player.exotic_upgrades.H.x3).toBeTruthy();
      expect(spec.state.player.resources['1H'].number).toEqual(0);
      expect(spec.state.player.resources.xH.number).toEqual(75);
      expect(spec.state.player.statistics.exotic_run).toEqual({H:{}});
    });
  });

  describe('infusion', function() {
    it('should set infusion percentage', function() {
      spec.data.resources = {
        p: {elements: {}, type: ['subatomic']}
      };
      spec.state.player.resources.p = {number:1001, unlocked: true};

      spec.exotic.setPercentage('p', 25);

      expect(spec.exotic.infuse.p).toEqual(250);
    });

    it('should calculate the infusion power', function() {
      spec.data.resources = {
        p: {elements: {}, type: ['subatomic']}
      };
      spec.state.player.resources.p = {number:0, unlocked: true};
      spec.exotic.infuse.p = 0;

      let value = spec.exotic.infuseBoost('p');

      expect(value).toEqual(1);
    });

    it('should calculate the infusion power 2', function() {
      spec.data.resources = {
        p: {elements: {}, type: ['subatomic']}
      };
      spec.state.player.resources.p = {number:1000, unlocked: true};
      spec.exotic.infuse.p = 1000;

      let value = spec.exotic.infuseBoost('p');

      expect(value).toBeCloseTo(1.309565534755485, 4);
    });

    it('should calculate the total infusion power', function() {
      spec.data.resources = {
        p: {elements: {}, type: ['subatomic']},
        n: {elements: {}, type: ['subatomic']}
      };
      spec.state.player.resources.p = {number:1000, unlocked: true};
      spec.state.player.resources.n = {number:1000, unlocked: true};
      spec.exotic.infuse.p = 1000;
      spec.exotic.infuse.n = 1000;

      let value = spec.exotic.totalInfuseBoost();

      expect(value).toBeCloseTo(1.7149618898, 4);
    });

    it('should include infusion into exotic production', function() {
      spec.data.elements.H = {
        exotic:'xH',
        includes: ['1H']
      };
      spec.data.resources = {
        '1H': {elements: {H: 1}, type: ['isotope']},
          p: {elements: {}, type: ['subatomic']},
          n: {elements: {}, type: ['subatomic']}
      };
      spec.state.player.resources['1H'] = {number:5e8, unlocked: true};
      spec.state.player.statistics.exotic_run = {H:{}};
      spec.state.player.statistics.exotic_run.H['1H'] = 5e8;
      spec.state.player.resources.xH = {number:0, unlocked: false};
      spec.state.player.resources.p = {number:1000, unlocked: true};
      spec.state.player.resources.n = {number:1000, unlocked: true};
      spec.exotic.infuse.p = 1000;
      spec.exotic.infuse.n = 1000;
      spec.state.player.element_slots = [{
        element: 'H',
        upgrades: {},
        generators: {},
        reactions: [],
        redoxes: []
      }];

      spec.exotic.update(spec.state.player);
      spec.exotic.exoticPrestige(0);

      expect(spec.state.player.resources.xH.number).toEqual(128);
    });
  });

  describe('purchase functions', function() {
    it('should purchase an upgrade if cost is met', function() {
      spec.data.elements.H = {exotic:'xH'};
      spec.data.exotic_upgrades = {
        x3: {
          price: 100,
          exotic_deps: [],
          dark_deps: []
        }
      };
      spec.state.player.resources.xH = {number:110};
      spec.state.player.exotic_upgrades = {
        H: {
          x3: false
        }
      };
      spec.state.player.element_slots = [{
        element: 'H'
      }];

      spec.exotic.buyExoticUpgrade('x3',spec.state.player.element_slots[0]);

      expect(spec.state.player.resources.xH.number).toEqual(10);
      expect(spec.state.player.exotic_upgrades.H.x3).toEqual(true);
    });

    it('should not purchase an upgrade if cost is not met', function() {
      spec.data.elements.H = {exotic:'xH'};
      spec.data.exotic_upgrades = {
        x3: {
          price: 100,
          exotic_deps: [],
          dark_deps: []
        }
      };
      spec.state.player.resources.xH = {number:10};
      spec.state.player.exotic_upgrades = {
        H: {
          x3: false
        }
      };
      spec.state.player.element_slots = [{
        element: 'H'
      }];

      spec.exotic.buyExoticUpgrade('x3',spec.state.player.element_slots[0]);

      expect(spec.state.player.resources.xH.number).toEqual(10);
      expect(spec.state.player.exotic_upgrades.H.x3).toEqual(false);
    });

    it('should skip if the upgrade is already bought', function() {
      spec.data.elements.H = {exotic:'xH'};
      spec.data.exotic_upgrades = {
        x3: {
          price: 100,
          exotic_deps: [],
          dark_deps: []
        }
      };
      spec.state.player.resources.xH = {number:110};
      spec.state.player.exotic_upgrades = {
        H: {
          x3: true
        }
      };
      spec.state.player.element_slots = [{
        element: 'H'
      }];

      spec.exotic.buyExoticUpgrade('x3',spec.state.player.element_slots[0]);

      expect(spec.state.player.resources.xH.number).toEqual(110);
      expect(spec.state.player.exotic_upgrades.H.x3).toEqual(true);
    });
  });

  describe('visibility functions', function() {
    it('should show if an exotic upgrade is visible', function() {
      spec.data.exotic_upgrades = {
        x3: {
          price: 100,
          exotic_deps: [],
          dark_deps: []
        }
      };
      spec.state.player.exotic_upgrades = {
        H: {}
      };
      spec.state.player.element_slots = [{
        element: 'H',
        upgrades: {}
      }];

      let values = spec.exotic.visibleExoticUpgrades(spec.state.player.element_slots[0], spec.state.player);

      expect(values).toEqual(['x3']);
    });
    it('should show visibile subatomic', function() {
      spec.data.resources = {
        p: {elements: {}, type: ['subatomic']},
        n: {elements: {}, type: ['subatomic']}
      };
      spec.state.player.resources.p = {number:0, unlocked: true};
      spec.state.player.resources.n = {number:0, unlocked: false};

      let values = spec.exotic.visibleSubatomic();

      expect(values).toEqual(['p']);
    });
  });
});
