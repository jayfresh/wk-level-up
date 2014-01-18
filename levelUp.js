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
var moment = require('moment');

function level_up(items, now) {
  var stepsToHours = {
    radical: [4, 8, 24, 2*24],
    kanji: [4, 8, 24, 3*24]
  }
  , sumFromStep = function(itemType, step) {
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
    if(item.label==='radical') {
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
  if(lockedRadicals) {
    // TO-DO
  }
  if(apprenticeRadicals) {
    radicals.forEach(function(radical) {
      if(radical.user_specific) {
        var step = radical.user_specific.meaning_correct;
        hours += sumFromStep('radical', step);
        return false;
      }
    });
  }
  if(lockedKanji) {
    hours += sumFromStep('kanji', 0);
  }
  if(apprenticeKanji) {
    kanji.forEach(function(k) {
      if(k.user_specific) {
        var step = k.user_specific.meaning_correct;
        hours += sumFromStep('kanji', step);
        return false;
      }
    });
  }
  now.add('hours', hours);
  return now;
}

module.exports = level_up;