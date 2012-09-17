tokiko (兎季子)
======

今更感漂う人工無能です。
IRCに入って学習、適当な文章を吐きます。
とりあえず単純なマルコフ連鎖するだけ。
拡張していくかどうかは未定。

## Requirement

  * MongoDB (2.0.6で確認)
  * MeCab (0.98で確認)

## Installation
あんまり確認してないけど、適当にgit cloneしてから依存ライブラリを入れればOK

    $ git clone git@github.com:kazy111/tokiko.git tokiko
    $ cd tokiko
    $ npm install irc@0.3.4
    $ npm install mongoose@3.1.2

mecabはこのへんからよろしくお願いします
    https://github.com/nmatsui/node-mecab

※package.jsonを参照してバージョンは合わせる感じで

接続設定とかは config.js を書き換えて下さい。
見たらだいたいわかるんじゃないかなー(丸投げ)

実行は普通に以下。

    $ node app.js

loadlog.js はテキストファイルを学習させたときの書き捨てスクリプトです。
