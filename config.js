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
    talkProb: 0.2,
    // talk channels (initial state)
    talkChannels: [],
    // message pattarn of name (100% response if talk ON)
    talkNameRegex: /(tokiko|‚Æ‚«‚±|“e‹Gq)/,
    // message pattarn of talk ON
    talkOnRegex: /(‚Æ‚«‚±|“e‹Gq)(‹N|‚¨)‚«‚ë/,
    // message pattarn of talk OFF
    talkOffRegex: /(‚Æ‚«‚±|“e‹Gq)(Q|‚Ë)‚ë/
};
