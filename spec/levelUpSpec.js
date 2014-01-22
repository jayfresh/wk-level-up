var level_up = require('../levelUp'),
  moment = require('moment');

describe('level_up', function() {
  describe('unlocked kanji and radicals (but some locked kanji still)', function() {
    it("should return 4.5 days + time to next review for the radical, if there is one kanji that remains locked and there is one apprentice radical that is one step away from being gurued", function() {
      var now = moment(),
        one_hour_from_now = moment(now).add('hour', 1);
      var items = [{
        label: 'kanji',
        user_specific: null
      }, {
        label: 'radicals',
        user_specific: {
          meaning_correct: 3,
          available_date: one_hour_from_now.unix(),
          srs: 'apprentice'
        }
      }];
      var d = level_up(items, now);
      expect(d.diff(now, 'hours', true)).toEqual(1+4.5*24);
    });
    it("should return 8 days if there is one radical that is apprentice; there is one locked kanji and one apprentice kanji", function() {
      var now = moment();
      var items = [{
        label: 'radicals',
        user_specific: {
          meaning_correct: 0,
          available_date: now.unix(),
          srs: 'apprentice'
        }
      }, {
        label: 'kanji',
        user_specific: null
      }, {
        label: 'kanji',
        user_specific: {
          meaning_correct: 0,
          srs: 'apprentice'
        }
      }];
      var d = level_up(items, now);
      expect(d.diff(now, 'hours', true)).toEqual(8*24);
    });
    it("should return 8 days if there are two radicals that are apprentice; there are two locked kanji and two apprentice kanji", function() {
      var now = moment();
      var items = [{
        label: 'radicals',
        user_specific: {
          meaning_correct: 0,
          srs: 'apprentice'
        }
      }, {
        label: 'radicals',
        user_specific: {
          meaning_correct: 0,
          srs: 'apprentice'
        }        
      }, {
        label: 'kanji',
        user_specific: null
      }, {
        label: 'kanji',
        user_specific: null
      }, {
        label: 'kanji',
        user_specific: {
          meaning_correct: 0,
          srs: 'apprentice'
        }
      }, {
        label: 'kanji',
        user_specific: {
          meaning_correct: 0,
          srs: 'apprentice'
        }
      }];
      var d = level_up(items, now);
      expect(d.diff(now, 'hours', true)).toEqual(8*24);      
    });
    xit("should ignore kanji or radicals where any error has been made", function() {
      expect(true).toEqual(false);
    });
    it("should return full kanji time plus remaining to-guru time of lowest level radical, if there are locked kanji and radicals are not step 0 any more", function() {
      var now = moment(),
        one_hour_from_now = moment(now).add('hours',1),
        two_hours_from_now = moment(now).add('hours',2);
      var items = [{
        label: 'radicals',
        user_specific: {
          meaning_correct: 1,
          srs: 'apprentice',
          available_date: one_hour_from_now.unix()
        }
      }, {
        label: 'radicals',
        user_specific: {
          meaning_correct: 2,
          srs: 'apprentice',
          available_date: two_hours_from_now.unix()
        }        
      }, {
        label: 'kanji',
        user_specific: null
      }];
      var d = level_up(items, now);
      expect(Math.round(d.diff(now, 'hours', true))).toEqual(1+4.5*24+3.5*24-4); 
    });
    it("should return full kanji time plus remaining to-guru time of lowest level radical, if there are locked kanji and radicals are not step 0 any more, even if the radicals are not ordered by lowest level first", function() {
      // now try the same with the radicals the other way around
      var now = moment(),
        one_hour_from_now = moment(now).add('hours',1),
        two_hours_from_now = moment(now).add('hours',2);
      var items = [{
        label: 'radicals',
        user_specific: {
          meaning_correct: 2,
          srs: 'apprentice',
          available_date: one_hour_from_now.unix()
        }
      }, {
        label: 'radicals',
        user_specific: {
          meaning_correct: 1,
          srs: 'apprentice',
          available_date: two_hours_from_now.unix()
        }        
      }, {
        label: 'kanji',
        user_specific: null
      }];
      d = level_up(items, now);
      expect(Math.round(d.diff(now, 'hours', true))).toEqual(2+4.5*24+3.5*24-4);
    });
    xit("should return full kanji time plus remaining to-guru time of lowest level and oldest radical, if there are locked kanji and radicals are not step 0 any more", function() {
      expect(true).toEqual(false);  
    });
    it("should return 4.5 days plus longest time to next radical review, if there are radicals with one step left until guru and locked kanji", function() {
      var now = moment(),
        one_hour_from_now = moment(now).add('hours',1),
        two_and_a_half_hours_from_now = moment(now).add('hours',2.5);
      var items = [{
        label: 'radicals',
        user_specific: {
          meaning_correct: 3,
          srs: 'apprentice',
          available_date: one_hour_from_now.unix()
        }
      }, {
        label: 'radicals',
        user_specific: {
          meaning_correct: 3,
          srs: 'apprentice',
          available_date: two_and_a_half_hours_from_now.unix()
        }
      }, {
        label: 'kanji',
        user_specific: null
      }];
      d = level_up(items, now);
      expect(d.diff(now, 'hours', true)).toEqual(2.5+4.5*24);
    });
  });
  describe('unlocked kanji only (radicals are guru)', function() {
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
  });
  describe('unlocked radicals only (kanji are locked)', function() {
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
  });
  describe('nothing unlocked', function() {
    it("should return 8 days if there are locked radicals and locked kanji", function() {
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
});