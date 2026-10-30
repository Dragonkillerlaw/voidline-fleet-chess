# Tactical academy: scope and findings

This is a first teaching framework for VOIDLINE's current v3 rules, not a claim of mature chess theory or globally optimal openings. Every exercise uses the production engine. No special combat rules or scripted success sequences are substituted.

## How a useful move is evaluated

1. Look for an immediate win using the full two-activation budget.
2. Check whether the opponent can destroy the mothership core before the planned payoff resolves. Neutralize that threat or move the core clear.
3. Compare the two actions together: focus fire, shield-generator removal before a finishing shot, or friendly clearance before a piercing beam. A ship that moves cannot fire again in the same turn.
4. Evaluate actual rays, terrain, damage, retaliation and escape squares. Geometric proximity by itself is not an advantage.

Damage, territory and safety can conflict. The no-loss puzzle explicitly adds survival of a fighter as a goal; the game does not universally forbid sacrificing a unit to win. Guided stationary-target lessons explicitly state their limited objective rather than implying the opponent will remain stationary in a real match.

## Endgame verification

Run `node scripts/analyze-tactics.mjs` to rebuild `tactical-analysis.json`. The solver enumerates all legal actions in the attacking side's remaining turn, including early ending, rotation, movement, firing, charge and reload where applicable. Equivalent pass/end-turn aliases are counted once and resignation is excluded because it cannot satisfy these objectives. For the delayed-win puzzle, every legal defending continuation through its full next turn is checked. The ordinary heuristic bot is not used to establish a forced win.

| Puzzle | Visited attacker states | Winning ordered lines | Finding |
|---|---:|---:|---|
| Focus fire | 1,393 | 2 | Two one-damage shots, either order |
| Break shield | 462 | 1 | Piercing cannon disables the generator before the small finishing shot |
| Clear friendly lane | 375 | 13 | Multiple safe displacement squares, then the cannon |
| Delayed finish | 48,311 | 10 | Disable the enemy cannon **or** move the friendly core clear, combined with a center missile hit; either order |

These are bounded, curated positions. Counts are not a search of the complete game's decision tree. Hidden remote motherships in small lessons preserve the real engine's victory rules and cannot affect the local goal within the exercise horizon; they are not selectable in the teaching UI. The solver may enumerate their harmless legal actions too.

The browser evaluates the requested goal after legal actions, not an exact answer list. Alternate lines that reach it pass. Failed delayed attacks receive an actual counterexample enemy continuation. Hints are progressive; demonstrations do not earn completion credit. Progress is stored locally in the browser and can be unavailable when browser storage is blocked.

## Opening plans

The original position has one exposed blue core in the enemy arsenal's range: B7, at Manhattan distance 9. The blue mothership's initial forward beam intersects no enemy modules, so spending an opening action on charging should not automatically be presented as development.

- **Escort:** shift the aegis east two cells to cover B7, then command all four fighters forward two cells. This also exposes high-altitude B11 to missiles; the illustrative enemy locks that square and develops corvettes. The proposed eastward two-cell group dodge on the next blue turn is legal.
- **Flanks:** command both corvettes forward three cells and target R7 with a missile. The illustrative enemy moves R7 clear and locks B7 in return. The first missile deals no damage; the demonstrable gain is an induced move, whose value depends on the resulting position.
- **Reserve:** retreat B7 three cells, changing its distance to the enemy arsenal from 9 to 12, then target R7. The enemy evades and develops a high fighter. Safety is gained at the cost of slower development.

The three plans have legal four-action walkthroughs with explicit costs and one illustrative opponent response. They are not forcing variations or proven best play. Each can be continued as an AI practice position. Further balance work should use recorded human games and broader adversarial search; it is not implied by these lessons.
