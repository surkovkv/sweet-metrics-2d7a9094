## Plan: UX refinements (10 items)

### 1. Landing — swap order of "Tournament Strategist" and "Matchup Table"

File: `src/pages/Landing.tsx`

- In the hero CTA buttons (lines 45–67) put **Matchup Table** button first (left), then **Tournament Strategist**.
- In the feature cards grid (lines 78–128) put the Matchups card first, then Tournament card, then News. Make the Matchups card use the highlighted primary style currently on the Strategist card and the Strategist card use the neutral style — so the visual emphasis follows the new left position.

### 2. Tournament Strategist — prettier filter layout

File: `src/pages/TournamentStrategist.tsx` (lines 309–357)

- Wrap the three filters (Rank / Min Archetype Games / Min Matchup Games) in a single rounded card: `rounded-2xl bg-secondary/40 border border-border p-3` with internal dividers between groups.
- Stack each filter as `label on top, select below`, group them in a flex row with `gap-6` on desktop and `grid-cols-1` on mobile.
- Use small icon prefixes (Trophy for rank, Layers for archetype games, Swords for matchup games) for visual rhythm.
- Keep existing values and onChange behavior unchanged.

### 3. "How does it work?" — replace concept text, keep only "Принцип работы"

Files: `src/pages/TournamentStrategist.tsx` (lines 271–307), `src/i18n/translations.ts` (all 8 languages).

- Change the toggle button label `tournament.howItWorks` to `"Принцип работы"` (and equivalent translations: How it works / Cómo funciona / 工作原理 / Comment ça marche / Como funciona / कैसे काम करता है / كيف يعمل).
- Replace `tournament.conceptDesc` with the new long text:
  > «Концепция турнирного бана»
  > В турнирном формате каждый игрок использует 3–4 колоды. Перед началом первого матча игроки банят по одной колоде противника — она становится недоступной на всю серию.
  > Задача помощника — помочь принять взвешенное решение. На основе статистики встреч и винрейтов инструмент подсказывает, какую колоду противника выгоднее всего отправить в бан. В результате твои оставшиеся колоды получают максимально удобные матчапы.
  > (Translate to all 8 languages with consistent meaning.)
- Remove the inner abbreviation grid (`avgWr / minWr / ban` cards) and the colors legend line — render only the title and the new paragraph.
- Drop the now-unused keys from the JSX: `avgWr`, `avgWrDesc`, `minWrLabel`, `minWrDesc`, `banLabel`, `banDesc`, `colors`, `colorGreen/Yellow/Red`. Translation keys can stay (still used elsewhere if any) — just stop rendering them here.

### 4. Add 2-deck mode (2v2 tournament)

File: `src/pages/TournamentStrategist.tsx`

- Change `type DeckMode = 3 | 4;` → `2 | 3 | 4`.
- Initial state arrays change to support `mode = 3` default, but include 2 in the toggle: `[2, 3, 4].map(...)` (lines 362).
- `handleModeChange` resize logic: generalize to `Array.from({length: newMode}, (_, i) => arr[i] ?? "")`.
- Add translation key `tournament.decks2` = "2 колоды" / "2 decks" / etc.
- `BAN_HISTORY_KEY` already keyed by mode, so 2 just gets its own slot. Initial `setBanHistory` loads modes 2/3/4.
- All ban-strategy functions in `src/data/banStrategy.ts` already iterate dynamically — no changes needed.

### 5. Fix layout shift when opening deck dropdowns

File: `src/index.css` (or global CSS)

- Radix Dialog/Select adds `padding-right` on `<body>` when locking scroll → page shifts when scrollbar disappears.
- Add a global rule:
  ```css
  html { scrollbar-gutter: stable; }
  body[data-scroll-locked] { padding-right: 0 !important; margin-right: 0 !important; overflow: auto !important; }
  ```
- This reserves the scrollbar gutter permanently and neutralizes Radix's compensation.

### 6. Remove the data-source line in TournamentStrategist header

File: `src/pages/TournamentStrategist.tsx` (lines 266–268)

- Delete the `<p>{t("tournament.updated")} {DATA_UPDATED} · {t("tournament.legendData")} (patch 35.0.3)</p>` paragraph entirely.

### 7. Highlight low-sample fallback in matchup matrix

File: `src/pages/TournamentStrategist.tsx` (`MatchupMatrix` lines 848–940 + `getWinrate` 116–120)

- Detect "all-grey" condition: when `showResult` is true, count cells where `getWinrate(my, opp) !== null`. If 0 → fall back: re-compute using raw `matchupDB` ignoring `minMatchupGames`.
- Add a new prop `fallbackMode: boolean` to `MatchupMatrix`. When true:
  - Render a prominent yellow banner above the table:
    > «В выбранной колоде/фильтре недостаточно игр. Расчёт показан по доступной выборке. Будь осторожен — данные могут быть нерепрезентативны.»
  - For each cell, if the underlying `games` value < 50, wrap value in yellow background `bg-yellow-500/15` with a small ⚠ icon and tooltip "Менее 50 игр — низкая надёжность".
- Implementation: pass a second getter `getWinrateRaw` (no min filter) to the matrix; matrix uses it when `fallbackMode` is on.

### 8. Replace "X игр" next to archetype in the deck dropdown

File: `src/pages/TournamentStrategist.tsx` (`ArchetypeSelect` lines 988–1020)
Proposed alternatives — pick one (default: option A):

- **A. Average winrate** — show `WR 52.3%` (already pre-computed as `safeWr`). Color-coded green/yellow/red. Most actionable for picking decks.
- **B. Popularity %** — show `pop 8.4%` from `archetype.popularity`. Useful for "what will I face" intuition.
- **C. Tier badge** — "S/A/B/C" computed from winrate brackets. Compact and visual.
- **D. Class color dot + WR%** — combines class identity and strength.

Default implementation: **option A** with color coding. Keep games count visible only on hover via Tooltip.

### 9. Searchable archetype dropdown

File: `src/pages/TournamentStrategist.tsx` (`ArchetypeSelect`)

- Replace Radix `Select` with a Popover + `cmdk` Command (already in project: `src/components/ui/command.tsx`).
- Pattern: Button trigger showing current value; on open shows `<CommandInput placeholder="Search...">` + `<CommandList>` with `<CommandItem>` for each archetype. cmdk handles substring matching for free (typing "har" filters to "Harold Rogue", etc.).
- Disabled items (excludeValues) keep `data-[disabled=true]` styling.
- Keep the same prop signature so callers don't change.

### 10. Remove "«—» — менее 500 игр" caption from results

File: `src/pages/TournamentStrategist.tsx` (lines 933–936)

- Delete the `<p className="text-xs text-muted-foreground mt-3 ...">{t("tournament.matrixNote")}</p>` block under the matchup matrix.

---

## Technical summary

- Files touched: `src/pages/Landing.tsx`, `src/pages/TournamentStrategist.tsx`, `src/index.css`, `src/i18n/translations.ts`.
- New deps: none (cmdk + Popover already exist).
- No DB / edge-function changes.
- No breaking API changes — all changes are UI/UX and one type widening (`DeckMode`).

## Open question for item 8

Default is **option A (avg winrate, color-coded)**. If you prefer a different alternative (B popularity, C tier badge, D class dot + WR), say so before approval and I'll switch.