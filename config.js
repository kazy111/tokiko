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
    talkNameRegex: /(tokiko|�Ƃ���|�e�G�q)/,
    // message pattarn of talk ON
    talkOnRegex: /(�Ƃ���|�e�G�q)(�N|��)����/,
    // message pattarn of talk OFF
    talkOffRegex: /(�Ƃ���|�e�G�q)(�Q|��)��/
};
