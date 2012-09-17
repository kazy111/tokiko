var config = require('./config.js');

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
    debug: config.debug,
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
    
    var words = split_sentence(msg);

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
        study(words);
    }
    
    if (talkFlag && (nameFlag || (Math.random() < config.talkProb))) {
        markov(function(msg){
            client.say(to, msg);
        }, words);
    }
});

client.addListener('pm', function(from, msg) {
    // admin execute any irc command
    if (from == config.adminName) {
        client.send(msg);
    }
});

function split_sentence(msg){
    var ret = [];
    var tmp = mecab.parse(msg);
    for (var i = 0; i < tmp.length; i++) {
        ret.push({word: tmp[i][0], part: tmp[i][1]});
    }
    if (config.debug) { console.log(ret); }
    return ret;
}

function study(words){
    var tmp = words.slice(0);
    tmp.unshift(['__start', '__start']);
    tmp.push(['__end', '__end']);
    
    for (var i = 0; i < tmp.length - 1; i++) {
        // count up
        WordDB.update(
            { word_a: tmp[i].word, part_a: tmp[i].part, word_b: tmp[i+1].word, part_b: tmp[i+1].part },
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

function markov(thunk, org_words) {
    
    var reduce = function(key, values) {
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
    };
    var map = function() {
        var key = this.word_a + '_' + this.part_a;
        emit(key, {word: this.word_b, part: this.part_b,
                   count: this.count, sum: this.count});
    };
    
    function markov_inner(word, part, words) {
        // find random next word
        WordDB.collection.mapReduce(
            map, reduce, {query: {word_a: word, part_a: part}, out: {inline: 1}},
            function(err, docs){
                if(!err && docs.length > 0){
                    var val = docs[0].value;
                    
                    if (val.part == '__end' || words.length >= org_words.length) {
                        if (config.debug) { console.log(words); }
                        thunk(words.join(''));
                    } else {
                        if (config.debug) { console.log(val); }
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

// experimental, incomplete
function markov_template(thunk, org_words) {
    
    var reduce = function(key, values) {
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
    };
    var map = function() {
        var key = this.word_a + '_' + this.part_a;
        emit(key, {word: this.word_b, part: this.part_b,
                   count: this.count, sum: this.count});
    };
    
    function markov_inner(word, part, org_words, words) {
        // find random next word
        console.log('org_words: '+org_words);
        var org_word = org_words.shift();
        console.log('org_word: '+org_word);
        console.log('org_word.part: '+org_word.part);
        WordDB.collection.mapReduce(
            map, reduce, {query: {word_a: word, part_a: part, part_b: org_word.part}, out: {inline: 1}},
            function(err, docs){
                if ( docs.length == 0 ) {
                    if (config.debug) { console.log(words); }
                    thunk(words.join(''));
                } else if(!err){
                    var val = docs[0].value;
                    
                    if (val.part == '__end' || org_words.length == 0) {
                        if (config.debug) { console.log(words); }
                        thunk(words.join(''));
                    } else {
                        if (config.debug) { console.log(val); }
                        words.push(val.word);
                        markov_inner(val.word, val.part, org_words, words);
                    }
                } else {
                    console.error('markov db error: ' + err);
                }
            }
        );
        
    }
    markov_inner('__start', '__start', org_words, []);
}
