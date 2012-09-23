#!/bin/sh

export HUBOT_IRC_SERVER="c.ustream.tv"
export HUBOT_IRC_PORT="6667"
export HUBOT_IRC_USERNAME="_tokiko*"
# if IRC server require your password
export HUBOT_IRC_PASSWORD=""
export HUBOT_IRC_ROOMS="#kazy"
export HUBOT_IRC_NICK="_tokiko_"

coffee --nodejs --harmony-collections ./node_modules/hubot/bin/hubot -a irc -n tokiko
