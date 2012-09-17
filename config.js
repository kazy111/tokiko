module.exports = {
    // acministrator name (use control by private message)
    adminName: 'kazy_cocoa',

    // irc setting
    userName: '_tokiko_',
    passWord: '',
    initChannels: ['#kazy'],
    server: 'c.ustream.tv',
    // mongo DB address
    dbURL: 'mongodb://localhost/tokiko',

    // talk probability
    talkProb: 0.4,
    // talk channels (initial state)
    talkChannels: [],
    // message pattarn of name (100% response if talk ON)
    talkNameRegex: /(tokiko|ときこ|兎季子)/,
    // message pattarn of talk ON
    talkOnRegex: /(ときこ|兎季子)(起|お)きろ/,
    // message pattarn of talk OFF
    talkOffRegex: /(ときこ|兎季子)(寝|ね)ろ/
};
