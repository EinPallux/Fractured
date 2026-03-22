# Fractured – Clash of Borders

A fully playable browser-based TCG implementation of "Fractured" — your custom card game.

## How to Deploy on Vercel (Free Plan)

### Option 1: Drag & Drop (Easiest)
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"** → **"Deploy from CLI"** OR drag the folder onto the Vercel dashboard
3. Done! Vercel will give you a public URL immediately.

### Option 2: Via Vercel CLI
```bash
npm install -g vercel
cd fractured/
vercel deploy
```

### Option 3: GitHub
1. Push this folder to a GitHub repo
2. Import the repo at vercel.com
3. No build settings needed (static HTML)

## Features Implemented

### ✅ Core Rules
- 2 full decks (Deck A: Aetherflare Dominion / Deck B: Ironfang Vanguard)
- All 5 phases: Start → Draw → Main → End
- Aether resource system (max 8, resets each turn)
- Mulligan (swap up to 3 cards)

### ✅ Card Types
- **Minions** – ATK/HP, attack after playing (except Surge)
- **Spells** – one-time effects, discarded after use
- **Weapons** – equip to hero, durability system

### ✅ All Special Effects
- ⚡ **Surge** – Attack immediately on play
- 🛡 **Bulwark** – Must be attacked first
- ☠ **Venombrand** – Marked minions die at end of round
- ❤ **Lifebond** – Damage dealt = HP healed
- 💀 **Execution Mark** – Instantly kill targets ≤2 HP
- 😴 **Nullbind** – Deactivate a minion for 1 turn
- 🌪 **Blade Dance** – Second attack on weakest minion (½ ATK)

### ✅ Combat Rules
- Simultaneous damage (both take hits)
- Hero with weapon attacks minion: no counter damage
- Minion attacks hero directly: simultaneous exchange
- Bulwark forces targeting
- Overdamage allowed

### ✅ All Battlecry Effects
- Draw cards, deal damage, Nullbind, Venombrand grant, Bulwark removal, summon tokens

### ✅ Hero Abilities
- **Mira (Deck A):** Draw 1 + 1 dmg to random enemy minion (1 Aether)
- **Ironhide (Deck B):** +1 ATK to random own minion this turn (1 Aether)

### ✅ AI Opponent
- Plays cards strategically (prioritizes expensive cards, value plays)
- Smart targeting (kills minions, respects Bulwark, goes face when optimal)
- Uses hero spell and weapon
- Handles all card effects

### ✅ Win Conditions
- Enemy hero drops to 0 HP
- Opponent has no deck + no hand + no board at end of their turn

## Controls
- **Click hand card** to play it
- **Click own minion** to select as attacker
- **Click enemy minion/hero** to attack
- **Click hero portrait** to attack with weapon
- **Escape** to cancel current action
- **Enter** to end turn
- **Hover** any card to see details
