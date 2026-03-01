
## Plan: Merge feature cards from 3 to 2 on Landing page

### What changes
In `src/pages/Landing.tsx`, the features grid currently has 3 cards:
1. **Анализ колоды** — keep as-is
2. **Оптимальный бан** — remove
3. **Турнирный режим** — keep, merge description from "Оптимальный бан" into it

### Implementation

**File: `src/pages/Landing.tsx`**
- Change grid from `md:grid-cols-3` to `md:grid-cols-2`
- Remove the "Оптимальный бан" card
- Update "Турнирный режим" description to include ban info, e.g.: `"3 или 4 колоды, матрица винрейтов, рекомендация по бану и детальная стратегия с расчётом последствий"`

One file, ~3 lines changed.
