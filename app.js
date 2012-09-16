// acministrator name (control by pm)
var adminName = 'kazy_cocoa';

// bot setting
var userName = '_tokiko_';
var passWord = '';
var initChannels = ['#kazy'];
var dbURL = 'mongodb://localhost/tokiko';

var talkProb = 0.2;
var talkChannels = [];
var talkNameRegex = /(tokiko|ときこ|兎季子)/;
var talkOnRegex = /(ときこ|兎季子)(起|お)きろ/;
var talkOffRegex = /(ときこ|兎季子)(寝|ね)ろ/;



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
mongoose.connect(dbURL);

var WordDB = mongoose.model('Word');

var client = new irc.Client('c.ustream.tv', userName, {
    debug: true,
    userName: userName,
    realName: userName,
    password: passWord,
    channels: initChannels,
});

client.addListener('error', function(msg) {
    console.error('ERROR: %s: %s', msg.command, msg.args.join(' '));
});
client.addListener('message', function(from, to, msg) {
    console.log(from + '=> ' + to + ': ' + msg);
    

    // name judge
    var nameFlag = msg.match(talkNameRegex);
    
    // judge talk switch
    var talkFlag = (talkChannels.indexOf(to) > -1);
    if (!talkFlag && msg.match(talkOnRegex)) {
        talkChannels.push(to);
        talkFlag = true;
    } else if(talkFlag && msg.match(talkOffRegex)) {
        talkChannels.splice(talkChannels.indexOf(to), 1);
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
    if (from == adminName) {
        client.send(msg);
    }
});

function study(msg){
    
    var tmp = mecab.parse(msg);
    tmp.unshift(['__start', '__start']);
    tmp.push(['__end', '__end']);
    //console.log( tmp );
    for(var i = 0; i < tmp.length - 1; i++){
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
        for(var i in values) {
            total += values[i].sum;
            if(rnd <= total){
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
                    
                    if(val.part == '__end' || words.length > length){
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

