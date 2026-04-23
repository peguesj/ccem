#!/bin/bash
# CCEM APM Server start script — sets full PATH for mise-managed Elixir/Erlang
# Created to fix CodeReloader crash: bare 'mix' not found when launched from launchd
# Use this script instead of 'mix phx.server' directly from any context.

export PATH="/Users/jeremiah/.mise/shims:/Users/jeremiah/.mise/installs/elixir/1.18.3-otp-27/bin:/Users/jeremiah/.mise/installs/erlang/27.3.4/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

cd /Users/jeremiah/Developer/ccem/apm-v4 || exit 1
exec mix phx.server
