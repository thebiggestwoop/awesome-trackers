# Awesome Trackers

System-agnostic token trackers and an initiative tracker for [Owlbear Rodeo](https://www.owlbear.rodeo/) — track HP, resources, and status on your tokens for any game system, run initiative with support for multiple activations per token, and control exactly what players can see.

## Installing

Install this extension using the install link: **https://awesome-trackers.heruv.uk/manifest.json**

In Owlbear Rodeo, open the Extensions panel → **Add custom extension** → paste that URL.

## Contents

- [Token trackers](#token-trackers)
- [Presets and scene defaults](#presets-and-scene-defaults)
- [Ally / Enemy visibility](#ally--enemy-visibility)
- [Initiative tracker](#initiative-tracker)
- [Scene settings](#scene-settings)
- [Uninstalling](#uninstalling)
- [Building](#building)
- [Attributions](#attributions)
- [License](#license)

---

## Token trackers

Every token can hold up to **12 trackers**, each one of five types:

| Type | What it's for |
|---|---|
| **Bar** (`value-max`) | A value/max pair rendered as a bar above or below the token — HP, Structure, etc. |
| **Number** (`value`) | A bubble with a free-text field — type a value directly or use inline math (see below). |
| **Counter** | A bubble with +/- stepper buttons alongside the value — quicker for stats you mostly nudge by 1 (stacks of a condition, tallies, etc). |
| **Checkbox** | An on/off flag, shown as a filled/empty circle. |
| **Counter with Temp** | A bubble whose displayed number is the *sum* of two independently-tracked values (e.g. Resistance + Temp Resistance) — each has its own +/- stepper, but only the total shows on the map. Currently only available through presets, not the tracker-add menu. |

**Right-click a token** to open the context menu embed and edit its trackers directly.

**Inline math** works in any tracker's text field, using 7 as an example:

- `+7` — add 7 to the current value
- `-7` — subtract 7 from the current value
- `=7` — set the value to 7 outright (also `=-7` for a negative value)

Click the **expand icon** in the context menu to open the full **editor**, where you can rename a tracker, pick its color (from a 9-color palette, or presets can specify an exact hex color), toggle whether it shows on the map, toggle inline math on/off, drag to reorder, or delete it. Use the **+ button** to add a new Bar/Number/Counter/Checkbox tracker to the selected token.

A few tracker behaviors are only configurable through presets (not the editor UI), since they're meant for game-system-specific setups rather than everyday tweaking:

- **Hide when zero** — the tracker (or, for a Bar, its max) disappears from the map entirely once it's at 0, instead of showing an empty bar/bubble.
- **Always visible** — exempts a tracker from Ally/Enemy hiding rules (see below), so it always renders for everyone regardless of the token's classification.
- **Hide value from players** — the tracker's bubble always shows, but its number is hidden from players specifically (the GM still sees it) — useful for a "something's active" indicator like Overshield that shouldn't reveal an exact amount.
- **Corner anchoring** — pins a bubble/counter to a specific corner of the token instead of the default stacking order.

---

## Presets and scene defaults

Rather than setting up the same trackers on every token by hand, a scene can have **named presets** — one per game system, for example. Open **Set scene default trackers** (the expand icon next to that label in the action popover) to manage them.

Two presets are built in and can be added with one click:

- **Lancer** — HP, Heat, Structure, Stress, Overshield (value hidden from players), Burn.
- **Ascension** — HP, WP, Health Bars, Resistance (with Temp Resistance folded in), Temp HP (value hidden from players), Persistent.

You can also create your own named presets from scratch, switch which one is active for the scene, or delete ones you no longer need.

Once a preset is active, adding it to a token is one click from the context menu — see [Ally / Enemy visibility](#ally--enemy-visibility) below.

---

## Ally / Enemy visibility

The first time you open the tracker menu on a token that hasn't been classified yet, you'll be asked to mark it as an **Ally** or an **Enemy** (GM only can mark something an Enemy) — this applies the scene's active preset and drives what players can see:

- **Ally** tokens show all their trackers to everyone, same as the GM sees them.
- **Enemy** tokens hide tracker values from players by default — players see that a tracker exists but not its number, unless the tracker is marked **Always visible**, or a value like HP is intentionally shown per your preset's own rules.
- Trackers marked **Hide when zero** disappear from the map for everyone once empty, regardless of Ally/Enemy status.

A GM can reclassify or remove a token's classification (**Remove Ally**/**Remove Enemy**) from the same menu, which also clears its trackers.

---

## Initiative tracker

Click the extension's toolbar icon to open **Initiative** — a Party/Adversaries/Defeated list adapted from Pretty Sordid Initiative's "zipper" mode (no numeric rolls, just ready ↔ active toggling and an undo stack).

- **Join as Ally** (anyone) or **Join as Enemy** (GM only) from the tracker menu adds the selected token to initiative. This is independent of a token's Ally/Enemy *tracker-hiding* classification — you can put a token on the Party side of initiative without it counting as an Ally for HP-hiding purposes, or vice versa.
- Click a slot's ready flag to **activate** it (marks it spent for the round); click it again to **re-ready** it, which restores whichever slot was active immediately before it.
- Tokens that act more than once a round (Elites, bosses) can hold up to **3 activation slots**, added/removed independently with the +/- stepper next to their entry.
- **Mark Defeated**/**Revive** (GM only, from the tracker menu) moves a token to its own Defeated section, out of the Party/Adversaries lists.
- **New Round** (GM only) readies every slot, clears who's active, and advances the round counter — which the GM can also jump directly via the Round field.
- Players only see initiative entries for tokens that are actually visible to them.

---

## Scene settings

Open **Scene Settings** (the expand icon in the Initiative popover, GM only) for:

- **Vertical Offset** — nudges trackers up/down relative to the token.
- **Trackers above token** — flips whether trackers render above or below the token.
- **Use reduced bar height** — a slimmer bar style, useful when a token has several Bar trackers stacked.
- **Enable Segments** — turns a Bar tracker's fill into discrete segments (e.g. one segment per hit die) instead of a smooth gradient; configurable per bar-tracker name once enabled.
- **Show name tags** — displays each token's name alongside its trackers.
- **Hide all enemy stats from players** — a scene-wide override that hides every tracker *and* bar on Enemy tokens from players entirely, regardless of each tracker's individual Always visible/Hide value settings. Off by default; useful for GMs who don't want players to see even that a stat exists.

---

## Uninstalling

Refresh your page after uninstalling the extension to clear trackers from the map. Token data (trackers, initiative state) is **not** deleted by uninstalling — reinstalling picks it back up.

---

## Building

This project uses [pnpm](https://pnpm.io/) as a package manager.

To install all the dependencies run:

`pnpm install`

To run in a development mode run:

`pnpm dev`

To make a production build run:

`pnpm build`

The build output goes to `docs/`, which is what's hosted at the install link above via GitHub Pages.

## Attributions

This is a fork of [owl-trackers](https://github.com/SeamusFinlayson/owl-trackers) by [Seamus Finlayson](https://www.patreon.com/SeamusFinlayson), extended with the Ally/Enemy visibility model, per-tracker hide rules, the Counter with Temp variant, named scene presets (including the built-in Lancer and Ascension presets), the "Hide all enemy stats" setting, and the initiative tracker (itself adapted from Pretty Sordid Initiative's zipper mode).

## License

GNU GPLv3, same as the upstream project this was forked from.
