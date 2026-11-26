# Aeris Valley Air Rally

[![make.fun](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![Rank](https://make.fun/badge/best-flight-game-20261126-0057/Vins1206/best-flight-game-20261126-0057/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![Reward](https://make.fun/badge/best-flight-game-20261126-0057/Vins1206/best-flight-game-20261126-0057/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)

A complete, original flight game for the [make.fun best flight game bounty](https://make.fun/bounty/best-flight-game-20261126-0057) ($500, top 50 share).

Fly the **Kitefin KF-7** prop plane over **Aeris Valley** — a volcanic island valley with a river, a lake, a town, a lighthouse and snow-capped ridges. Chase view and cockpit view, a lit instrument panel, and a HUD with altitude, speed and heading.

## What you fly

- **3 missions:** Ring Rally (fly 6 golden rings in order, then land), Runway Landing (line up on Runway 27, gear down, flare soft — scored on touchdown quality), and Free Flight (rings respawn, fuel is the limit).
- **Real flying:** throttle, pitch, bank, stall, airbrake, flaps and gear. Fuel burns, hard ground contact crashes, soft runway touchdowns score.
- **Feel:** engine hum and ring chimes synthesised in WebAudio, a camera that follows the bank, a ground shadow, birds, drifting clouds and a golden-hour sun.
- **Controls:** W/S throttle, arrow keys pitch + bank, mouse steers, wheel throttle, Space airbrake, G gear, F flaps, C camera, M mission, R restart, Enter to fly.

## How to run

```sh
node serve.ts
# open http://localhost:8080
```

Static files only — `game/index.html` plays offline in desktop Chrome, no network requests, no build step.

## Hand-in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-game.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots in `screenshots/` are real renders of the game's own code, taken in a desktop browser from the staged poses in `game/src/shots.js` (`?shot=cover|rings|landing|cockpit`).
