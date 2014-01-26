var http = require('http'),
  fs = require('fs'),
  request = require('request'),
  _ = require('underscore'),
  moment = require('moment'),
  JSON = require('JSON'),
  express = require('express'),
  cons = require('consolidate'),
  Handlebars = require('handlebars'),
  level_up = require('./levelUp'),
  app = express();

app.engine('html', cons.handlebars);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(express.bodyParser());
app.use(express.static(__dirname+'/public'));
app.use(app.router);

app.get('/', function(req, res) {
    // output results
    res.render('index', {
      title: 'WaniKani Next Reviews'
    });
});

app.get('/results', function(req, res) {
  var api_key = req.query.api_key;
  if(!api_key) {
    return res.redirect('/');
  }
  // get user info to get level
  request("http://www.wanikani.com/api/user/"+api_key+"/user-information", function(error, response, body) {
    var data = JSON.parse(body),
      user_level = data.user_information.level,
      //user_level = 8,
      count = 0,
      itemsToGet = ['radicals', 'kanji'], // not vocabulary
      limit = itemsToGet.length, // limit the number of API requests to the three item types
      allItems = [],
      unlockedItems = [],
      lockedItems = [],
      correctItems = [],
      incorrectItems = [],
      completionCallback = function() {
        var now = new Date(),
          prettyDate = function(epoch) {
            return (new Date(epoch*1000)).toUTCString();
          },
          inThePast = function(epoch) {
            return (new Date(epoch*1000)) < now;
          };
        // flatten all the arrays into a single level
        allItems = _.flatten(allItems, true);
        // get rid of items that are not unlocked
        // items that are not unlocked do not have a user_specific property set
        unlockedItems = _.filter(allItems, function(item) {
          var unlocked = !!item.user_specific;
          if(unlocked) {
            item.correctCount = item.user_specific.reading_correct ? Math.min(item.user_specific.meaning_correct, item.user_specific.reading_correct) : item.user_specific.meaning_correct;
            item.leftToGuru = 4 - item.correctCount;
            item.currentStreak = item.user_specific.reading_current_streak ? Math.min(item.user_specific.reading_current_streak, item.user_specific.meaning_current_streak) : item.user_specific.meaning_current_streak;
            // don't allow guru'd items in
            if(item.user_specific.srs!=='apprentice') {
              return false;
            } else {
              return item.user_specific;  
            }
          } else {
            lockedItems.push(item);
          }
        });
        // order all by available_date
        unlockedItems.sort(function(a, b) {
          var user_specific_a = a.user_specific,
            user_specific_b = b.user_specific;
          return user_specific_a.available_date > user_specific_b.available_date ? 1 : (user_specific_a.available_date < user_specific_b.available_date ? -1 : 0);
        });
        // make dates readable
        _.each(unlockedItems, function(item) {
          var dateToShow = item.user_specific ? prettyDate(item.user_specific.available_date) : '';
          item.dateToShow = dateToShow;
          item.available = inThePast(item.user_specific.available_date) && 'available';
          item.srs = item.user_specific.srs;
          console.log(item.character, item.srs, item.label, item.dateToShow);
        });
        // get the incorrect items
        _.each(unlockedItems, function(item) {
          if(item.user_specific.meaning_incorrect || item.user_specific.reading_incorrect) {
            incorrectItems.push(item);  
          } else {
            correctItems.push(item);
          }
        });
        // work out when you are going to level up next
        var now = moment(),
          level_up_moment = level_up(allItems, now),
          level_up_out = moment.duration(level_up_moment-now).humanize();
        // output results
        res.render('results', {
          title: 'WaniKani Next Reviews - results',
          level: user_level,
          locked: lockedItems,
          incorrect: incorrectItems,
          correct: correctItems,
          level_up: level_up_out,
          level_up_calendar: level_up_moment.calendar()
        });
      };
    // request radicals, kanji and vocab for that level
    _.each(itemsToGet, function(label) {
      request("http://www.wanikani.com/api/user/"+api_key+"/"+label+"/"+user_level, function(error, response, body) {
        var data = JSON.parse(body);
        _.each(data.requested_information, function(item) {
          item.label = label;
          if(!item.character) {
            item.character = '<img src="'+item.image+'">';
          }
        });
        allItems.push(data.requested_information);
        count++;
        if(count>=limit) {
          completionCallback();
        }
      });    
    });  
  });
    
});

// Register partials
var partials = "./views/partials/";
fs.readdirSync(partials).forEach(function (file) {
    var source = fs.readFileSync(partials + file, "utf8"),
        partial = /(.+)\.html/.exec(file).pop();
    Handlebars.registerPartial(partial, source);
});

var port = process.env.PORT || 5000;
app.listen(port);
console.log('Listening on port '+port);