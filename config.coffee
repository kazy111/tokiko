module.exports = {
    debug: true

    # mongo DB address
    dbURL: 'mongodb://localhost/tokiko'

    # talk probability
    talkProb: 0.4
    # talk channels (initial state)
    talkChannels: ['#kazy']
    # message pattarn of name (100% response if talk ON)
    talkNameRegex: /(tokiko|ときこ|兎季子)/
    # message pattarn of talk ON
    talkOnRegex: /(ときこ|兎季子)(起|お)きろ/
    # message pattarn of talk OFF
    talkOffRegex: /(ときこ|兎季子)(寝|ね)ろ/
    
    # upper limit of number of words
    maxWordLength: 18
}
