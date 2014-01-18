var level_up = require('../levelUp'),
  moment = require('moment');

describe('level_up', function() {
  it("should return 4.5 days if there is a kanji that has no progress and no apprentice radicals", function() {
    var now = moment();
    var items = [{
      label: 'radical',
      user_specific: {
        srs: 'guru'
      }
    }, {
      label: 'kanji',
      user_specific: {
        meaning_correct: 0,
        srs: "apprentice"
      }
    }];
    var d = level_up(items, now);
    expect(d.diff(now, 'hours')).toEqual(4.5*24);
  });
  it("should return 4.5 days + 2 days if there is one kanji that remains locked and there is one apprentice radical that has just become one step away from being gurued", function() {
    var now = moment();
    var items = [{
      label: 'kanji',
      user_specific: null
    }, {
      label: 'radicals',
      user_specific: {
        meaning_correct: 3,
        srs: 'apprentice'
      }
    }];
    var d = level_up(items, now);
    expect(d.diff(now, 'hours')).toEqual(4.5*24+2*24);
  });
  it("should return 8 days if there is one radical that has no progress and a locked kanji", function() {
    var now = moment();
    var items = [{
      label: 'radicals',
      user_specific: {
        meaning_correct: 0,
        srs: 'apprentice'
      }
    }, {
      label: 'kanji',
      user_specific: null
    }];
    var d = level_up(items, now);
    expect(d.diff(now, 'hours')).toEqual(8*24);
  });
  it("should return 8 days if there are unlocked radicals and unlocked kanji", function() {
    var now = moment();
    var items = [{
      label: 'radicals',
      user_specific: null
    }, {
      label: 'kanji',
      user_specific: null
    }];
    var d = level_up(items, now);
    expect(d.diff(now, 'hours')).toEqual(8*24);      
  });
});