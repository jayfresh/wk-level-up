var http = require('http'),
  fs = require('fs'),
  request = require('request'),
  _ = require('underscore'),
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
      limit = 3, // limit the number of API requests to the three item types
      allItems = [],
      unlockedItems = [],
      lockedItems = [],
      completionCallback = function() {
        var prettyDate = function(epoch) {
          return (new Date(epoch*1000)).toUTCString();
        };
        // flatten all the arrays into a single level
        allItems = _.flatten(allItems, true);
        // get rid of items that are not unlocked
        // items that are not unlocked do not have a user_specific property set
        unlockedItems = _.filter(allItems, function(item) {
          var unlocked = !!item.user_specific;
          if(unlocked) {
            return item.user_specific;  
          } else {
            locked.push(item);
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
          item.srs = item.user_specific.srs;
          console.log(item.character, item.srs, item.label, item.dateToShow);
        });
        console.log(unlockedItems);
        console.log(lockedItems);
        // work out when you are going to level up next
        var level_up_date = level_up(allItems);
        
        // output results
        res.render('results', {
          title: 'WaniKani Next Reviews - results',
          level: user_level,
          unlocked: unlockedItems,
          locked: lockedItems
        });
      };
    // request radicals, kanji and vocab for that level
    _.each(['radicals', 'kanji', 'vocabulary'], function(label) {
      request("http://www.wanikani.com/api/user/"+api_key+"/"+label+"/"+user_level, function(error, response, body) {
        var data = JSON.parse(body);
        _.each(data.requested_information, function(item) {
          item.label = label;
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