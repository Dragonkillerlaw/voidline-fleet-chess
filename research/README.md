# Tactical academy: progression and verification

The academy teaches production v4 rules through bounded examples, not mature chess theory or optimal openings.

## Progression

| Stage | Exercises | Learning objective |
|---|---|---|
| Ship skills (6) | Firing square; off-axis cannon; escape the cone; shield counterattack; evade splash; group evasion | Range, coverage, exchanges, safe destinations and action efficiency |
| Fleet combinations (4) | Focus fire; shield relay; disable the gun; missile–cannon trap | Use two activations for complementary purposes |
| Endgames (4) | Focus finish; shield removal; friendly clearance; delayed finish | Calculate a winning line and its cost |

The two shield lessons explicitly prescribe an enemy counterattack. A human opponent may retreat instead. These lessons demonstrate actual absorption and replenishment; they do not claim a forced favorable exchange. Success depends on real damage and shield records, not a sequence of buttons.

Cannon denial searches all distinct legal defensive outcomes. Moving sideways one, two or three cells remains vulnerable; moving four cells escapes. The missile–cannon trap gives the defender one movement exit: remain at the missile center and die, or move into charged-cannon coverage. Every reply is checked for immediate victory or a lethal charged follow-up. The demonstration chooses the escape and allows the learner to finish on the next turn.

## Cannon geometry

The cone has its apex at the weapon module and a 45° half-angle around the bow axis. Aim at any in-bounds cell center in that cone within Euclidean range 14. One continuous ray extends to full range, damaging every voxel interior it crosses, including friends. Simultaneous boundary crossings advance all tied axes: touching only an edge or corner is not a hit. Asteroids stop the ray; hulls, wrecks and nebula do not.

Shading shows the union of reachable cannon rays on the selected altitude. Exact shot previews remain decisive. Coverage is a threat, not an automatic attack or a movement restriction. Charge costs one action, takes an opponent turn, and is cancelled by movement or rotation. A one-cell sidestep that escaped the old axial gun may therefore fail now.

## Evaluating a useful move

1. Find an immediate win with two different ship activations.
2. Check charged-cannon coverage and pending missile impact, including splash.
3. Compare the complete exchange: damage, shared shield depletion, replenishment and escape routes.
4. Combine roles: protect and attack; disable and finish; force movement and cover the exit.
5. Preserve resources needed for the second step. Firing a charged cannon early ruins the missile trap.

## Endgame verification

Run `node scripts/analyze-tactics.mjs` to regenerate `tactical-analysis.json`. It exhausts the attacker's remaining turn and, for the delayed finish, the defender's full reply. Cannon aims with identical ordered module hits share a representative because they produce the same board and shield state. Counts describe distinct search choices, not every geometrically different ray. Pass/end-turn aliases are merged and resignation is excluded.

| Puzzle | Attacker states | Winning representative lines | Finding |
|---|---:|---:|---|
| Focus fire | 1,393 | 2 | Two one-damage shots, either order |
| Break shield | 483 | 2 | Two cannon aims; both precede the fighter finisher |
| Clear friendly lane | 568 | 13 | Move the friendly fighter to safety, then fire |
| Delayed finish | 48,311 | 2 | Disable the gun and center the missile, either order; a one-cell mothership sidestep fails |

The shield puzzle was repositioned: the enemy core is outside the cannon cone but within Aegis coverage. The cannon dismantles that Aegis, enabling the fighter's final shot. This prevents an aimed cannon from bypassing the intended ordering puzzle.

Hidden remote motherships preserve ordinary victory rules and are not selectable in the teaching UI. The solver may enumerate their legal actions. Hints and demonstrations reveal a reference line; demonstrations do not earn progress. Browser-local progress uses study IDs, preserving old completions after reordering.

## Opening plans

The three existing four-action examples remain legal. The initial cannon cone can now reach enemy modules: an empty forward-only ray no longer makes charging automatically pointless. Charging still gives the enemy a full turn to react.

- Escort: reposition the Aegis to protect B7, then advance fighters together. Check the newly exposed high-altitude fighter for missiles.
- Flanks: advance both corvettes and target a vulnerable enemy corvette. The sample defender dodges, demonstrating tempo rather than guaranteed damage.
- Reserve: withdraw B7 beyond missile range and force a reply elsewhere, at the cost of slower development.

These plans state tradeoffs and illustrative responses; they are not forced variations or proven best play. Balance and match duration need further human playtesting.
