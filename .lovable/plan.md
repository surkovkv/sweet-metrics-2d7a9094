

## Plan: 5 improvements to TourneyHelper

### 1. Meta-трекер in navbar + mobile nav check
Already present in `ManaLensNavbar.tsx` (line 14: `/meta` with `TrendingUp` icon). Just need to verify mobile — the navbar currently uses `hidden sm:inline` for labels, icons always visible. No code changes needed, already works.

### 2. Deck comparison in Analyzer
Add a second deck input + side-by-side comparison view in `src/pages/Analyzer.tsx`:
- Add state for `deckInfo2` and `deckCode2`
- Add toggle button "Сравнить две колоды"
- When both decks are decoded, show a comparison layout: two columns with mana curves, dust cost, type counts, and a diff summary (who has more spells, more dust, better curve, etc.)

### 3. Improve Meta-трекер (`src/pages/MetaTracker.tsx`)
- Add a **meta shift indicator** (trending up/down arrows) per archetype based on a `trend` field in data
- Add a **recommendation box**: "Лучший выбор для лестницы" — pick the highest WR deck that counters the top 3 popular decks
- Add winrate distribution bar in the tier list (colored bar showing WR visually)
- Add a **filter by class** dropdown
- Improve bubble chart: add axis tick marks, better labels, legend

### 4. Verify landing, meta-tracker, analyzer display
Will be done visually after implementation — no separate code task.

### 5. Add 5 news articles to `src/data/news.ts` + use as fallback
The News page currently only fetches from Supabase. When Supabase has no data, it shows "Публикаций пока нет". 

**Solution**: Add 5 new articles to `src/data/news.ts`, then update `src/pages/News.tsx` to fall back to static data when Supabase returns empty or errors. Topics:
1. "Новое дополнение: Перекрёстки Пустоты" — about a new expansion
2. "Турнир TourneyHelper Cup #1 — регистрация открыта"  
3. "Гайд: топ-5 колод для нового сезона"
4. "Обновление мета-трекера: новые архетипы"
5. "Патч 30.2: ключевые изменения баланса"

---

### Files to change

| File | Change |
|------|--------|
| `src/pages/Analyzer.tsx` | Add comparison mode: second input, side-by-side results |
| `src/pages/MetaTracker.tsx` | Add trend indicators, recommendation box, class filter, improved chart |
| `src/data/matchups.ts` | Add `trend` field to `ArchetypeInfo` and each entry |
| `src/data/news.ts` | Add 5 new Hearthstone news articles |
| `src/pages/News.tsx` | Fall back to static data when Supabase returns empty/error |

No new dependencies needed.

