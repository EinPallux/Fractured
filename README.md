# ⚡ Fractured – Clash of Borders

A fully playable browser TCG based on the custom card game "Fractured", built with Next.js + TypeScript + TailwindCSS. Runs on Vercel Hobby plan.

## 🚀 Deploy to Vercel

```bash
# 1. Push to GitHub (or just drag the folder into Vercel dashboard)
git init && git add . && git commit -m "Fractured TCG"

# 2. Import repo at vercel.com → New Project
# Framework: Next.js (auto-detected)
# Build command: npm run build (default)
# Output: .next (default)
```

No environment variables needed.

## 🃏 Game Rules Summary

- **Goal**: Reduce the enemy Hero to 0 HP
- **Resources**: Aether – starts at 1, increases by 1 per turn (max 8), resets to current max each turn
- **Deck**: 25 cards + 1 Hero card
- **Turn phases**: Start → Draw → Main (play/attack/abilities) → End
- **Minions**: Can't attack the turn they're played (unless Surge)
- **Bulwark**: Forces all attacks to target the Bulwark minion

### Special Effects
| Effect | Description |
|--------|-------------|
| **Surge** | Can attack immediately when played |
| **Bulwark** | Must be attacked first; protects others |
| **Venombrand** | Target minion dies at end of turn; +1 damage to heroes |
| **Lifebond** | Heals your hero equal to damage dealt |
| **Execution Mark** | Instantly kills targets with ≤ 2 HP |
| **Nullbind** | Minion cannot attack, block, or use abilities this turn |
| **Blade Dance** | Also hits the lowest-HP enemy for half damage |

## 🏗 Project Structure

```
fractured-tcg/
├── app/
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Entry → GameBoard
│   └── globals.css       # Tailwind + animations
├── components/
│   ├── GameBoard.tsx     # Main game UI + interactions
│   ├── Card.tsx          # Hand & field card rendering
│   ├── HeroCard.tsx      # Hero card + weapon + ability button
│   ├── GameLog.tsx       # Battle log panel
│   ├── MulliganScreen.tsx
│   └── GameOverScreen.tsx
└── lib/
    ├── cards.ts          # All 49 card definitions (Deck A + Deck B)
    ├── types.ts          # GameState, MinionState, all types
    └── engine.ts         # Full game engine (reducer + AI)
```

## 🤖 AI Behaviour

The AI runs a simple greedy strategy:
1. **Mulligan**: Replaces 2 most expensive cards
2. **Play phase**: Plays the highest-cost affordable card each turn
3. **Targeting**: Prefers lowest-HP enemies for damage; uses friendly buffs on highest-ATK minions
4. **Attack phase**: Attacks bulwark first, then lowest-HP minion, then enemy hero
5. **Hero ability**: Uses it whenever affordable

## 🎮 How to Play

1. Choose your deck on the start screen
2. Mulligan up to 3 cards from your opening hand
3. Click hand cards to play them (blue cost gem = Aether cost)
4. Click a friendly minion to select it as attacker (gold ring = ready to attack)
5. Click an enemy minion or the enemy hero card to attack
6. Use your Hero Ability button (costs 1 Aether)
7. Equip weapons from your hand; then the hero can attack
8. Click **End Turn** when done

## Local Development

```bash
npm install
npm run dev   # http://localhost:3000
```
