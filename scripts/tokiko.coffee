module.exports = (robot) ->
    config = require('../config.js')
    talkChannels = new Set config.talkChannels
    mecab = require('mecab')
    mongoose = require('mongoose')
    mongoose.model 'Word', new mongoose.Schema
        word_a: {type: String, required: true}
        part_a: {type: String, required: true}
        word_b: {type: String, required: true}
        part_b: {type: String, required: true}
        count:  {type: Number, default: 0}
    mongoose.connect config.dbURL
    WordDB = mongoose.model('Word')
    
    robot.hear config.talkOnRegex, (msg) ->
        talkChannels.add msg.message.user.room
 
    robot.hear config.talkOffRegex, (msg) ->
        talkChannels.delete msg.message.user.room
    
    robot.hear /^(.*)$/, (msg) ->
        m = msg.message.text
        r = msg.message.user.room
        words = split_sentence m
    
        # name judge
        nameFlag = m.match config.talkNameRegex
        # judge talk switch
        talkFlag = talkChannels.has(r) and not m.match config.talkOffRegex
        
        study(words) if !nameFlag
        markov(words, (txt) -> msg.send(txt)) if talkFlag and (nameFlag or (Math.random() < config.talkProb))
    
    split_sentence = (msg) ->
        for v in mecab.parse msg
            {word: v[0], part: v[1]}
    
    study = (words) ->
        tmp = words.slice 0
        tmp.unshift ['__start', '__start']
        tmp.push ['__end', '__end']
        i = 0
        while i < tmp.length-1
            WordDB.update(
                { word_a: tmp[i].word, part_a: tmp[i].part, word_b: tmp[i+1].word, part_b: tmp[i+1].part }
                { $inc: {count: 1} }
                { upsert: true }
                (err, num) -> console.error('error: ' + err) if err
            )
            i++
    
    markov = (org_words, output) ->
        reduce = (key, values) ->
            total = 0
            sum = 0
            for k, v of values
                sum += v.sum
            rnd = Math.round Math.random() * sum
            for k, v of values
                total += v.sum
                if rnd <= total
                    return {
                        word: v.word
                        part: v.part
                        count: v.count
                        sum: sum
                    }
        map = () ->
            emit '_', {
                word: this.word_b
                part: this.part_b
                count: this.count
                sum: this.count
            }
        markov_inner = (word, part, results) ->
            query = {word_a: word, part_a: part}
            # if sentence head
            query = {$and: [{part_b: /^(名詞|動詞|形容詞|副詞|感動詞|連体詞)$/}, query]} if results.length == 0
            # find random next word
            WordDB.collection.mapReduce(
                map
                reduce
                {query: query, out: {inline: 1}}
                (err, docs) ->
                    if !err and docs.length > 0
                        val = docs[0].value
                        #if val.part == '__end' or results.length >= org_words.length
                        if val.part == '__end' or val.part == '' or results.length >= config.maxWordLength
                            console.log results if config.debug
                            output results.join ''
                        else
                            console.log val  if config.debug
                            results.push val.word
                            markov_inner val.word, val.part, results
                    else
                        console.error 'markov db error: ' + err
            )
        markov_inner '__start', '__start', []
 