# VOIDLINE / 深空舰队棋 · Tactical Academy 04

A playable 3D fleet tactics prototype. Original procedural ship geometry and low-poly asteroid art; no downloaded art or third-party IP. Rendering uses a rotatable orthographic 3D projection with per-face depth sorting on Canvas 2D. Game coordinates and combat are fully three dimensional.

## 快速开始 / Quick start

VOIDLINE 是以三维空间、舰体舱段和两舰协作为核心的太空战术棋。包括 4 课基础教学、3 套开局计划和 4 道残局题。

线上版本：[VOIDLINE](https://voidline-fleet-chess.citrusjay16.chatgpt.site/)（保留原站点访问权限）。

需要 Node.js 22.13 或更高版本。

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5180
```

打开 [本地预览](http://127.0.0.1:5180)。开发服务器仅用于本机预览，会使用本地模拟登录。AI、教学和本机双人可直接使用；房间对战依赖 Cloudflare D1，集成检查见下方 Development。

```sh
node --test tests/rules.test.mjs tests/turns.test.mjs tests/academy.test.mjs
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

本仓库不包含部署凭据、房间数据、个人环境配置或原站点 project_id。GitHub 仓库提供源码；线上托管继续由现有 Sites 部署负责。

## Play

- The homepage opens the tactical academy. Four interactive lessons, three opening walkthroughs and four endgame puzzles teach one problem at a time. Hints, undo, retry, demonstrations and browser-local progress are supported; demonstrations do not count as completion. `/play` opens the complete game, and original `/?room=` invitation links still work.
- Opening walkthroughs show a legal plan, one illustrative opponent response, the tradeoff, and live range/shield facts. Continue the resulting position against AI using `/play?opening=escort` (or `flanks`, `reserve`). They are not claims of optimal play.
- AI exercise: human blue, deterministic heuristic AI orange.
- Same-device two-player: alternate full turns on one screen, with two different ship activations each.
- Online rooms: create or join with a six-character code. Server validates every action, hashes seat credentials, and atomically advances the version. Browser session storage preserves a seat across reloads. Rooms expire after seven days.
- Select a ship, choose Move / Rotate / Attack / Ability, preview, then confirm. M / R / F / S select actions; 1–6 change altitude; Enter confirms; Escape cancels. Movement controls include a distance selector. Drag to orbit, Shift/right-drag to pan, scroll to zoom. Focus centers the selected ship; Full Map resets the view. Slice isolates one altitude.

## Rules

14 × 14 × 6 voxels, 11 starting units per player: exactly one mothership, four fighters, two corvettes, one arsenal, one Aegis, one command ship and one command center. Mirrored deployments and terrain provide flank routes and altitude choices. Each side has **two activations per turn, on different ships**. The second activation automatically ends the turn; End Turn voluntarily forfeits unused activations. Group command costs one activation and marks the commander and all participating light ships as used. A group cannot include an already activated ship.

Translation is axis-aligned and the complete hull must clear each intermediate voxel. A 90° turn conservatively requires the quarter-turn voxel square to be clear. Destroyed cores leave solid wrecks. Destroy the enemy mothership core to win; simultaneous loss or 480 completed side turns (240 rounds) draws. The action revision `ply` is separate from the completed-turn clock `turnIndex`. Charge readiness, missiles, shields and production use complete turns.

| Unit | Hull | Move | Weapon / role |
| --- | --- | --- | --- |
| Mothership | 5 cells | 1 | Spend an action charging; on the next own turn, fire a forward beam up to 14 cells. Each hit module takes 4 damage. Penetrates hulls, wrecks, friends and nebula; rocks stop the beam. Moving/turning cancels charge. |
| Fighter | 1 | 4 | Range 2, damage 1. |
| Corvette | 2 | 3 | Range 3, damage 1. |
| Arsenal | 3 | 1 | Manhattan range 10, coordinate missile at the end of the opponent's full turn. Center damage 3, six adjacent voxels 1. Four rounds; reload takes an action. |
| Aegis | 2 | 2 | Shared 3-point shield for friendly modules within Manhattan distance 2 of its core. Refilled at each own turn start. Generator destruction disables it. Range 2, damage 1 defensive gun. |
| Command | 2 | 2 | One action translates all surviving friendly fighters or all corvettes by the same vector, within that class's speed. Any blocked path rejects the entire order. Destroyed command array disables coordination. |
| Command center | 3 | 0 | Every 4 completed own turns produces one fighter within Manhattan distance 2. Fleet limit 18 living units; blocked/full factories retain progress. Factory module destruction stops production. |

Ordinary guns follow the 26 axial/diagonal rays and stop at rocks, nebula, hulls and wrecks. Missile blasts can damage friends, ignore intervening obstacles, and cannot target rock cells. Ships may traverse nebula. Damage applies to individual modules: engine loss immobilizes larger ships; weapon loss disables their gun; capacitor loss disables charging. Aegis shields are shared pools, not separate shields on each ally.

Version 1/2 room snapshots are retained in storage but cannot be opened under version 3 rules. Create a new room for Strategy 03. Local session storage is versioned to avoid restoring an incompatible seat.

## Feedback and interface

The fleet roster starts hidden and opens as an overlay drawer. A sticky turn bar shows the active side, two action indicators, remaining activations and End Turn. A prominent color-coded banner announces turn handoff. Activated ships carry a check mark and cannot act again. Ship details and camera options are collapsed by default.

Structured combat records contain actual HP loss, absorbed shield damage, module health before/after, destruction, shot paths and explosion coordinates. The scene renders muzzle flashes, traveling missiles, beams, blast rings, damage numbers and health changes. A persistent Recent Combat card identifies affected ships and offers camera focus. A bounded history preserves both actions for polling clients. The AI spaces actions by 2.4 seconds; a short 1.9-second presentation pause gives feedback time to read.

## Development

`npm run dev -- --port 5180` for local preview. `node --test tests/rules.test.mjs tests/turns.test.mjs tests/academy.test.mjs` runs 54 tests including a complete AI match and exhaustive checks of all four endgames. `node scripts/analyze-tactics.mjs` regenerates the analysis in `research/tactical-analysis.json`; the design findings and search limits are documented in `research/README.md`. `node tests/rooms-v3.integration.mjs` verifies local D1 authentication, concurrency, reconnection, two-activation turns and combat records (set `VOIDLINE_TEST_URL` for a different local server). Run `node node_modules/typescript/bin/tsc --noEmit` for types. Sites build/source helpers package and publish the Worker and apply Drizzle migrations. The academy preserves version 3 game and room state, so it needs no schema migration and existing v3 rooms remain usable.

## Prototype limits

AI uses local heuristics rather than deep search. Balance and match duration are unproven. Room polling is 1.2 seconds; two player seats, no spectators or matchmaking. Current hosting audience is private until explicitly changed. No public contest submission has been made.

## Attribution

All fleet models, battlefield art, rules code and application UI created for this project. Framework dependencies retain their upstream licenses. Fonts: IBM Plex Sans (OFL) and Barlow Condensed (OFL), served by Google Fonts with system fallbacks.
