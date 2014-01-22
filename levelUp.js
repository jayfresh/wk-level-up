/* working out when you are going to level up next
          
  levelling up happens when 90% of kanji for the level are guru

  main problem: I don't know how to figure out which micro-SRS level an item is on
  srs progression is stated as:
    - radicals: 4h, 8h, 24h, 2d (guru), 1w, 2w (master), 1m (enlighten), 4m (burned)
    - kanji: 4h, 8h, 24h, 3d (guru), 1w, 2w (master), 1m (enlighten), 4m (burned)
  so the minimum time to guru a kanji is 4h+8h+24h+3d = 4.5 days (for radicals, it's 3.5 days)
  if a kanji is locked, you would want to add on the guru time for its component radicals
    - does the API show you what the component radicals are?
    - No. But the earliest you could level up would be 4.5 days after you guru the last radical
  as a naive first go, you could:
    - exclude all radicals & kanji that you've got wrong
    - figure out if you have unlocked 90% of the the kanji
      - if so:
        - calculate the longest to-guru time for the kanji
          - this involves finding the kanji with the joint highest number of steps left before guru (which is after step 4); for steps go from meaning_correct and subtract from 4
          - then finding the kanji with the latest available_date
          - then adding the right amount of time to that based on the number of steps left
      - if not:
        - calculate the longest to-guru time for the radicals
          - as above
        -  add 4.5 days to that

*/
var moment = require('moment'),
  _ = require('underscore');

function level_up(items, now) {
  var stepsToHours = {
    radical: [4, 8, 24, 2*24],
    kanji: [4, 8, 24, 3*24]
  }
  , sumFromStep = function(itemType, step) {
    if(step===stepsToHours[itemType].length-1) {
      return 0;
    }
    return stepsToHours[itemType].slice(step).reduce(function(prev, current) {
      return prev+current;
    });
  }
  , hours = 0
  , radicals = []
  , lockedRadicals = 0
  , apprenticeRadicals = 0
  , kanji = []
  , lockedKanji = 0
  , apprenticeKanji = 0;
  now = moment(now); // either clones or creates new if undefined
  items.forEach(function(item) {
    if(item.label==='radicals') {
      radicals.push(item);
      if(!item.user_specific) {
        lockedRadicals++;
      } else if(item.user_specific.srs==='apprentice') {
        apprenticeRadicals++;
      }
    } else if(item.label==='kanji') {
      kanji.push(item);
      if(!item.user_specific) {
        lockedKanji++;
      } else if(item.user_specific.srs==='apprentice') {
        apprenticeKanji++;
      }
    }
  });
  console.log(lockedRadicals, apprenticeRadicals, lockedKanji, apprenticeKanji);
  if(lockedRadicals) {
    hours += sumFromStep('radical', 0);
  } else if(apprenticeRadicals) {
    // get the lowest level radical
    var radicalsByLevel = {},
      lowestLevel = 3, // apprentice radicals could not be any higher than this
      lowestLevelRadicals;
    _.each(radicals, function(r, i) {
      var level = r.user_specific.meaning_correct;
      if(!radicalsByLevel[level]) {
        radicalsByLevel[level] = [];
      }
      radicalsByLevel[level].push(r);
      if(level < lowestLevel) {
        lowestLevel = level;
      }
    });
    lowestLevelRadicals = radicalsByLevel[lowestLevel];
    // now find the oldest of the lowest-level radicals
    var latestAvailableDate = now.unix();
    _.each(lowestLevelRadicals, function(radical) {
      var available_date = radical.user_specific.available_date;
      if(available_date) {
        if(available_date > latestAvailableDate) {
          latestAvailableDate = available_date;
        }
      } else {
        // it's not available, so hours could be infinite - let's just avoid this problem for now
      }
    });
    var hours_to_available = moment.unix(latestAvailableDate).diff(now, 'hours', true);
    hours += sumFromStep('radical', lowestLevel) + hours_to_available;
  }
  if(lockedKanji) {
    hours += sumFromStep('kanji', 0);
  } else if(apprenticeKanji) {
    kanji.forEach(function(k, i) {
      var step = k.user_specific.meaning_correct;
        //available_date = k.user_specific.available_date,
        //hours_to_available = now.diff(moment(hours_to_available), 'hours');
      hours += sumFromStep('kanji', step); // + hours_to_available;
      return false;
    });
  }
  hours = hours.toFixed(1);
  now.add('hours', hours);
  return now;
}

module.exports = level_up;