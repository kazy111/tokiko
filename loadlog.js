var fs = require('fs');

var mecab = require("mecab");
var mongoose = require("mongoose");

var txtfile = './input.txt';

var Schema = mongoose.Schema;
var WordSchema = new Schema({
    word_a: {type: String, required: true},
    part_a: {type: String, required: true},
    word_b: {type: String, required: true},
    part_b: {type: String, required: true},
    count: {type: Number, default: 0}
});

mongoose.model('Word', WordSchema);
mongoose.connect('mongodb://localhost/tokiko');
var WordDB = mongoose.model('Word');


var read = fs.createReadStream(txtfile, {encoding: 'utf8'});

read.on('data', function(data) {
    console.log(data)
    study(data);
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
