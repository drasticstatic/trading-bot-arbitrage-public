# Lock-screen alerts from the DEX arbitrage lane

*How FortunaTrades ARB reaches a phone, and how to follow it yourself. Public, no secrets involved. The same mechanism as Fortuna's perps terminal, so one subscription carries both lanes.*

## The problem

The terminal is a page. Its "enable desktop alerts" button uses the browser Notification API, which only fires while the page is open on a desktop browser. iOS shows web notifications only for a page installed to the Home Screen with a Web Push server behind it. The public copy on GitHub Pages has no server at all, so the phone never hears from it.

## The fix: push from the machine that knows

The bot already runs on a Mac, polling Arbitrum every few seconds. That machine knows when something matters, so it does the pushing:

1. **The bot** (`bot.js`) prices every live pool in one block, ranks routes after fees and quotes any positive route as a round trip at five sizes. Every event it shows the page goes through one `broadcast()`.
2. **The journal** (`helpers/journal.js`) writes each event to `logs/journal/` so the page can read any day back.
3. **The bridge** (`helpers/notify.js`) reads the same events and pushes the few that deserve a lock screen to [ntfy](https://ntfy.sh), an open-source push relay. One HTTP request with a title, a priority and a body. No account, no key.
4. **The ntfy app** (iOS, Android, or the web app) subscribed to the topic shows the message on the lock screen.

```sh
# the whole mechanism, by hand
curl -H "Title: ARB · lock screen test" -H "Priority: high" -d "focused-ubiquitous-unicorn cleared gas and fees" https://ntfy.sh/<topic>
```

The public mirror wears a costume: every pair is a stage name such as `focused-ubiquitous-unicorn`, every venue a house and a ward such as `Velvet Harbor`, and the numbers are the real ones. The private topic, on the phone of the person running the bot, says the real names.

## What gets pushed, and what does not

| Event | Priority | Throttle |
|---|---|---|
| A candidate that **would have fired** at the threshold | urgent | one per pair per 10 min |
| A candidate that **cleared gas and the flash-loan fee**, under the threshold | high | one per pair per 30 min |
| An **error** in the bot | high | one per message per 10 min |
| The bot **stopping**; a **trade** result | urgent | every time |
| The bot starting; test prices on or off | default | one per minute |
| The **nightly report** one-liner (23:55) | default | once a day |

Ordinary polls, price updates and the thousands of routes that are positive before fees but not after are never pushed. They live in the journal, where the terminal's Journal section and `node scripts/journal.js` read them back.

## Follow the lane's alerts

- Install ntfy from the App Store or Play Store, or open <https://ntfy.sh/app>.
- Subscribe to the topic **`fortunatrades-arb-live`**.
- That is all. Already following `fortuna-terminal-live` for the perps lane? Both show up in the same app, titled `ARB ·` and `Fortuna` so you can tell them apart.

Christopher's own phone subscribes to a separate private topic; the public one is a mirror of the same alerts. Topics are the only "secret" in ntfy: anyone who knows a topic name can read it **and post to it**, so treat a public topic as a feed and never as instructions. Nothing in this repo reads from a topic. The private topic name lives in a local file the bot never prints, logs or journals.

## Setting up your own private channel

```sh
# 1. invent a long random topic name and subscribe to it in the ntfy app
# 2. store it where the bridge reads it (never committed, never logged);
#    Fortuna's bridge reads the same file, so one subscription carries both lanes
mkdir -p ~/.config/fortuna && printf '%s' 'your-long-random-topic' > ~/.config/fortuna/ntfy_topic && chmod 600 ~/.config/fortuna/ntfy_topic
#    or, for this bot only, NTFY_TOPIC=your-long-random-topic in .env
# 3. test
node scripts/notify.js --status
node scripts/notify.js --title "lock screen test" --msg "hello from the ARB lane" --pri high --private-only
```

The bridge stays silent when no topic is configured and the public mirror is off (`NTFY_PUBLIC=0`), so every script can call it unconditionally. Self-hosting ntfy is also an option if the public relay is not wanted; set `NTFY_SERVER` to your server. `NTFY_DISABLE=1` turns every push off.

## Why not Telegram, Pushover, or a PWA

They all work. ntfy was chosen because it needs no account, no bot token and no server, which keeps this write-up honest: everything above can be reproduced from scratch in five minutes. A push relay is deliberately one-way; the bot takes no commands from it.
