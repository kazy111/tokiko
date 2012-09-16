var config = require('./config.js');
console.log(config);

var irc = require("irc");
var mecab = require("mecab");
var mongoose = require("mongoose");

var Schema = mongoose.Schema;
var WordSchema = new Schema({
    word_a: {type: String, required: true},
    part_a: {type: String, required: true},
    word_b: {type: String, required: true},
    part_b: {type: String, required: true},
    count: {type: Number, default: 0}
});
mongoose.model('Word', WordSchema);
mongoose.connect(config.dbURL);

var WordDB = mongoose.model('Word');

var client = new irc.Client(config.server, config.userName, {
    debug: true,
    userName: config.userName,
    realName: config.userName,
    password: config.passWord,
    channels: config.initChannels,
});

client.addListener('error', function(msg) {
    console.error('ERROR: %s: %s', msg.command, msg.args.join(' '));
});
client.addListener('message', function(from, to, msg) {
    console.log(from + '=> ' + to + ': ' + msg);
    

    // name judge
    var nameFlag = msg.match(config.talkNameRegex);
    
    // judge talk switch
    var talkFlag = (config.talkChannels.indexOf(to) > -1);
    if (!talkFlag && msg.match(config.talkOnRegex)) {
        config.talkChannels.push(to);
        talkFlag = true;
    } else if(talkFlag && msg.match(config.talkOffRegex)) {
        config.talkChannels.splice(config.talkChannels.indexOf(to), 1);
        talkFlag = false;
    } else if (!nameFlag) {
        study(msg);
    }

    
    if (talkFlag && (nameFlag || Math.random() < talkProb)) {
        markov(function(msg){
            client.say(to, msg);
        }, msg.length / 2);
    }
});

client.addListener('pm', function(from, msg) {
    // admin execute any irc command
    if (from == config.adminName) {
        client.send(msg);
    }
});

function study(msg){
    
    var tmp = mecab.parse(msg);
    tmp.unshift(['__start', '__start']);
    tmp.push(['__end', '__end']);
    //console.log( tmp );
    for (var i = 0; i < tmp.length - 1; i++) {
        // count up
        WordDB.update(
            { word_a: tmp[i][0], part_a: tmp[i][1], word_b: tmp[i+1][0], part_b: tmp[i+1][1] },
            { $inc: {count: 1} },
            { upsert: true },
            function(err, num) {
                if(err){
                    console.error('error: ' + err);
                }
            }
        );
    }
}

function markov(thunk, length) {
    
    var reduce = function(key, values) {
        //return values[0];
        var total = 0;
        var sum = 0;
        for(var i in values){
            sum += values[i].sum;
        }
        var rnd = Math.round(Math.random() * sum);
        for (var i in values) {
            total += values[i].sum;
            if (rnd <= total) {
                return {word: values[i].word, part: values[i].part,
                        count: values[i].count, sum: sum};
            }
        }
    }
    
    function markov_inner(word, part, words) {
        // find random next word
        var map = function() {
            var key = this.word_a + '_' + this.part_a;
            emit(key, {word: this.word_b, part: this.part_b,
                       count: this.count, sum: this.count});
        }
        
        WordDB.collection.mapReduce(
            map, reduce, {query: {word_a: word, part_a: part}, out: {inline: 1}},
            function(err, docs){
                if(!err && docs.length > 0){
                    var val = docs[0].value;
                    
                    if (val.part == '__end' || words.length > length) {
                        thunk(words.join(''));
                    } else {
                        words.push(val.word);
                        markov_inner(val.word, val.part, words);
                    }
                } else {
                    console.error('markov db error: ' + err);
                }
            }
        );
        
    }
    markov_inner('__start', '__start', []);
}

