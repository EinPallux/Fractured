import type {
  GameState, MinionState, HeroState, WeaponState,
  GameAction, PlayerId, SelectionPending, GameLog,
} from './types';
import { CARD_DEFS, DECK_A_IDS, DECK_B_IDS, getCard, type CardDef, type EffectKey } from './cards';

let instanceCounter = 0;
function newId(prefix: string): string {
  return `${prefix}_${++instanceCounter}_${Math.random().toString(36).slice(2, 6)}`;
}

function makeLog(message: string, type: GameLog['type'] = 'action'): GameLog {
  return { id: newId('log'), message, type, timestamp: Date.now() };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeckInstances(deckLabel: 'A' | 'B'): string[] {
  // Build 25 card deck from CARD_DEFS matching deck label
  // Some cards appear twice (cheap ones fill the deck)
  const base = CARD_DEFS.filter(c => c.deck === deckLabel).map(c => c.id);
  // Pad to exactly 25 by doubling cheap commons
  const deck: string[] = [...base];
  const commons = base.filter(id => {
    const c = getCard(id);
    return c.rarity === 'Common' && c.cost <= 2;
  });
  let i = 0;
  while (deck.length < 25) {
    deck.push(commons[i % commons.length]);
    i++;
  }
  return shuffle(deck.slice(0, 25));
}

function makeHero(): HeroState {
  return { hp: 20, maxHp: 20, weapon: null, heroAbilityUsedThisTurn: false };
}

function minionFromCard(cardId: string, owner: PlayerId): MinionState {
  const def = getCard(cardId);
  const hasSurge = def.effects.includes('surge');
  const hasBulwark = def.effects.includes('bulwark');
  const hasVenombrand = def.effects.includes('venombrand');
  const hasLifebond = def.effects.includes('lifebond');
  const hasExecutionMark = def.effects.includes('execution_mark');
  const hasBladeDance = def.effects.includes('blade_dance');
  return {
    instanceId: newId(cardId),
    cardId,
    atk: def.atk ?? 0,
    hp: def.hp ?? 1,
    maxHp: def.hp ?? 1,
    hasSurge,
    hasBulwark,
    hasVenombrand,
    hasLifebond,
    hasExecutionMark,
    hasNullbind: false,
    hasBladeDance,
    hasAttackedThisTurn: false,
    justPlayed: !hasSurge,
    venomBranded: false,
    tempAtkBonus: 0,
    owner,
  };
}

// ---- Damage helpers ----

function applyDamageToMinion(
  minion: MinionState,
  dmg: number,
  gs: GameState,
  attackerOwner?: PlayerId,
): { minion: MinionState; healed: boolean } {
  if (dmg <= 0) return { minion, healed: false };
  let newMinion = { ...minion, hp: minion.hp - dmg };

  // berserker: gains +1 ATK when hurt
  const def = getCard(minion.cardId);
  if (def.effects.includes('berserker_hurt') && dmg > 0) {
    newMinion = { ...newMinion, atk: newMinion.atk + 1 };
  }

  return { minion: newMinion, healed: false };
}

function healHero(hero: HeroState, amount: number): HeroState {
  return { ...hero, hp: Math.min(hero.maxHp, hero.hp + amount) };
}

function applyDamageToHero(hero: HeroState, dmg: number): HeroState {
  return { ...hero, hp: hero.hp - dmg };
}

function updateField(
  field: MinionState[],
  instanceId: string,
  update: Partial<MinionState>,
): MinionState[] {
  return field.map(m => m.instanceId === instanceId ? { ...m, ...update } : m);
}

function getField(gs: GameState, owner: PlayerId): MinionState[] {
  return owner === 'player' ? gs.playerField : gs.aiField;
}

function setField(gs: GameState, owner: PlayerId, field: MinionState[]): GameState {
  return owner === 'player'
    ? { ...gs, playerField: field }
    : { ...gs, aiField: field };
}

function getHero(gs: GameState, owner: PlayerId): HeroState {
  return owner === 'player' ? gs.playerHero : gs.aiHero;
}

function setHero(gs: GameState, owner: PlayerId, hero: HeroState): GameState {
  return owner === 'player'
    ? { ...gs, playerHero: hero }
    : { ...gs, aiHero: hero };
}

function getEnemy(owner: PlayerId): PlayerId {
  return owner === 'player' ? 'ai' : 'player';
}

// Remove dead minions from field, trigger death effects
function processDead(gs: GameState, logs: GameLog[]): GameState {
  let newGs = { ...gs };

  for (const owner of ['player', 'ai'] as PlayerId[]) {
    const field = getField(newGs, owner);
    const alive: MinionState[] = [];
    const dead: MinionState[] = [];
    for (const m of field) {
      if (m.hp <= 0) dead.push(m);
      else alive.push(m);
    }
    newGs = setField(newGs, owner, alive);

    for (const deadMinion of dead) {
      const def = getCard(deadMinion.cardId);
      logs.push(makeLog(`${def.name} dies`, 'death'));

      // Death effects
      if (def.effects.includes('death_1_dmg_all')) {
        // Funkenphönix: 1 dmg to all enemies
        const enemyOwner = getEnemy(owner);
        let enemyField = getField(newGs, enemyOwner);
        enemyField = enemyField.map(m => ({ ...m, hp: m.hp - 1 }));
        newGs = setField(newGs, enemyOwner, enemyField);
        // also damage hero
        let enemyHero = getHero(newGs, enemyOwner);
        enemyHero = applyDamageToHero(enemyHero, 1);
        newGs = setHero(newGs, enemyOwner, enemyHero);
        logs.push(makeLog(`Funkenphönix death: 1 damage to all enemies`, 'effect'));
      }

      // Add to graveyard
      if (owner === 'player') {
        newGs = { ...newGs, playerGraveyard: [...newGs.playerGraveyard, deadMinion.cardId] };
      } else {
        newGs = { ...newGs, aiGraveyard: [...newGs.aiGraveyard, deadMinion.cardId] };
      }
    }
  }

  // Recurse if new deaths occurred
  const totalDead = gs.playerField.filter(m => m.hp <= 0).length + gs.aiField.filter(m => m.hp <= 0).length;
  const newDead = newGs.playerField.filter(m => m.hp <= 0).length + newGs.aiField.filter(m => m.hp <= 0).length;
  if (newDead > 0) {
    newGs = processDead(newGs, logs);
  }

  return newGs;
}

// Check win condition
function checkWin(gs: GameState, logs: GameLog[]): GameState {
  if (gs.playerHero.hp <= 0) {
    return { ...gs, phase: 'game_over', winner: 'ai', winReason: 'Your hero has fallen!' };
  }
  if (gs.aiHero.hp <= 0) {
    return { ...gs, phase: 'game_over', winner: 'player', winReason: 'Enemy hero defeated!' };
  }
  return gs;
}

// Draw a card
function drawCard(gs: GameState, owner: PlayerId, logs: GameLog[]): GameState {
  const deck = owner === 'player' ? gs.playerDeck : gs.aiDeck;
  const hand = owner === 'player' ? gs.playerHand : gs.aiHand;
  if (deck.length === 0) {
    logs.push(makeLog(`${owner === 'player' ? 'You' : 'AI'} has no cards to draw!`, 'system'));
    return gs;
  }
  const [drawn, ...rest] = deck;
  const newHand = [...hand, drawn];
  logs.push(makeLog(`${owner === 'player' ? 'You draw' : 'AI draws'} a card`, 'action'));
  if (owner === 'player') {
    return { ...gs, playerDeck: rest, playerHand: newHand };
  } else {
    return { ...gs, aiDeck: rest, aiHand: newHand };
  }
}

// ---- Bulwark logic ----
function getBulwarkMinion(gs: GameState, owner: PlayerId): MinionState | null {
  const field = getField(gs, owner);
  return field.find(m => m.hasBulwark && !m.hasNullbind) || null;
}

// ---- Combat ----
export function doAttack(
  gs: GameState,
  attackerOwner: PlayerId,
  attackerId: string, // 'hero' or minion instanceId
  defenderOwner: PlayerId,
  defenderId: string, // 'hero' or minion instanceId
  logs: GameLog[],
): GameState {
  let newGs = { ...gs };
  const attackerIsHero = attackerId === 'hero';
  const defenderIsHero = defenderId === 'hero';

  let attackerAtk = 0;
  let attackerHasBladeDance = false;
  let attackerHasLifebond = false;
  let attackerHasVenombrand = false;
  let attackerHasExecutionMark = false;
  let attackerHasWeaponLifebond = false;
  let attackerHasWeaponExMark = false;

  if (attackerIsHero) {
    const weapon = getHero(newGs, attackerOwner).weapon!;
    attackerAtk = weapon.atk;
    attackerHasLifebond = weapon.hasLifebond;
    attackerHasExecutionMark = weapon.hasExecutionMark;

    // Wolfsherz on attack: all friendly minions +1 atk this turn
    if (weapon.hasAllyAtk) {
      const field = getField(newGs, attackerOwner);
      newGs = setField(newGs, attackerOwner, field.map(m => ({ ...m, tempAtkBonus: m.tempAtkBonus + 1 })));
      logs.push(makeLog('Wolfsherz Klinge: +1 ATK to all friendly minions this turn', 'effect'));
    }
  } else {
    const attackerMinion = getField(newGs, attackerOwner).find(m => m.instanceId === attackerId)!;
    attackerAtk = attackerMinion.atk + attackerMinion.tempAtkBonus;
    attackerHasBladeDance = attackerMinion.hasBladeDance;
    attackerHasLifebond = attackerMinion.hasLifebond;
    attackerHasVenombrand = attackerMinion.hasVenombrand;
    attackerHasExecutionMark = attackerMinion.hasExecutionMark;
  }

  // Defender HP before
  let defenderHp = defenderIsHero
    ? getHero(newGs, defenderOwner).hp
    : getField(newGs, defenderOwner).find(m => m.instanceId === defenderId)!.hp;

  // Execution Mark: if target HP <= 2, instakill
  let execMarkApplied = false;
  if ((attackerHasExecutionMark || attackerHasWeaponExMark) && !defenderIsHero && defenderHp <= 2) {
    execMarkApplied = true;
    logs.push(makeLog(`Execution Mark triggers! Target dies instantly.`, 'effect'));
    const defField = getField(newGs, defenderOwner).map(m =>
      m.instanceId === defenderId ? { ...m, hp: 0 } : m
    );
    newGs = setField(newGs, defenderOwner, defField);
    // Mark attacker as attacked
    if (!attackerIsHero) {
      newGs = setField(newGs, attackerOwner,
        getField(newGs, attackerOwner).map(m =>
          m.instanceId === attackerId ? { ...m, hasAttackedThisTurn: true } : m
        )
      );
    }
    newGs = processDead(newGs, logs);
    return newGs;
  }

  // Normal damage
  if (attackerIsHero) {
    // Hero attacks minion: hero takes no damage. minion takes weapon.atk dmg
    if (!defenderIsHero) {
      const defField = getField(newGs, defenderOwner);
      const defMinion = defField.find(m => m.instanceId === defenderId)!;
      const newHp = defMinion.hp - attackerAtk;
      const newField = defField.map(m =>
        m.instanceId === defenderId ? { ...m, hp: newHp } : m
      );
      newGs = setField(newGs, defenderOwner, newField);
      logs.push(makeLog(`Hero attacks ${getCard(defMinion.cardId).name} for ${attackerAtk}`, 'damage'));

      // Venombrand on hero weapon attack doesn't apply (not a minion)
      // Lifebond
      if (attackerHasLifebond) {
        newGs = setHero(newGs, attackerOwner, healHero(getHero(newGs, attackerOwner), attackerAtk));
        logs.push(makeLog('Lifebond: Hero heals for ' + attackerAtk, 'effect'));
      }
    } else {
      // Hero attacks enemy hero
      let defHero = getHero(newGs, defenderOwner);
      defHero = applyDamageToHero(defHero, attackerAtk);
      newGs = setHero(newGs, defenderOwner, defHero);
      // Attacker hero also takes counterattack? No - per rules hero with weapon vs hero: simultaneous
      // But per rules: if hero attacks minion, no counterdamage. Hero vs hero - rules don't explicitly say
      // We'll say hero vs hero: defender hero takes damage only (no counter)
      logs.push(makeLog(`Hero attacks enemy hero for ${attackerAtk}`, 'damage'));
      if (attackerHasLifebond) {
        newGs = setHero(newGs, attackerOwner, healHero(getHero(newGs, attackerOwner), attackerAtk));
      }
    }

    // Reduce weapon durability
    const hero = getHero(newGs, attackerOwner);
    const weapon = hero.weapon!;
    const newDur = weapon.durability - 1;
    const newWeapon = newDur <= 0 ? null : { ...weapon, durability: newDur, hasAttackedThisTurn: true };
    newGs = setHero(newGs, attackerOwner, { ...getHero(newGs, attackerOwner), weapon: newWeapon });
    if (newDur <= 0) logs.push(makeLog(`Weapon breaks!`, 'system'));

    // Funkenstab: extra 1 dmg to random enemy
    if (weapon.cardId === 'funkenstab') {
      const enemies = getField(newGs, defenderOwner);
      if (enemies.length > 0) {
        const target = enemies[Math.floor(Math.random() * enemies.length)];
        newGs = setField(newGs, defenderOwner,
          getField(newGs, defenderOwner).map(m =>
            m.instanceId === target.instanceId ? { ...m, hp: m.hp - 1 } : m
          )
        );
        logs.push(makeLog(`Funkenstab: 1 extra damage to ${getCard(target.cardId).name}`, 'effect'));
      }
    }
  } else {
    // Minion attacks
    const attackField = getField(newGs, attackerOwner);
    const attackerMinion = attackField.find(m => m.instanceId === attackerId)!;
    const actualAtk = attackerMinion.atk + attackerMinion.tempAtkBonus;

    if (defenderIsHero) {
      // Minion attacks hero: hero takes damage, minion takes hero weapon damage (if weapon)
      let defHero = getHero(newGs, defenderOwner);
      defHero = applyDamageToHero(defHero, actualAtk);
      newGs = setHero(newGs, defenderOwner, defHero);

      // Venombrand vs hero: +1 dmg
      if (attackerHasVenombrand) {
        defHero = applyDamageToHero(getHero(newGs, defenderOwner), 1);
        newGs = setHero(newGs, defenderOwner, defHero);
        logs.push(makeLog('Venombrand: +1 extra damage to hero', 'effect'));
      }

      // Counterdamage from hero weapon
      const defWeapon = getHero(newGs, defenderOwner).weapon;
      if (defWeapon) {
        const counterDmg = defWeapon.atk;
        newGs = setField(newGs, attackerOwner,
          getField(newGs, attackerOwner).map(m =>
            m.instanceId === attackerId ? { ...m, hp: m.hp - counterDmg } : m
          )
        );
        logs.push(makeLog(`${getCard(attackerMinion.cardId).name} attacks hero for ${actualAtk}, takes ${counterDmg} counter`, 'damage'));
      } else {
        logs.push(makeLog(`${getCard(attackerMinion.cardId).name} attacks hero for ${actualAtk}`, 'damage'));
      }

      if (attackerHasLifebond) {
        newGs = setHero(newGs, attackerOwner, healHero(getHero(newGs, attackerOwner), actualAtk));
        logs.push(makeLog('Lifebond: +' + actualAtk + ' HP', 'effect'));
      }
    } else {
      // Minion attacks minion: simultaneous damage
      const defField = getField(newGs, defenderOwner);
      const defMinion = defField.find(m => m.instanceId === defenderId)!;
      const defAtk = defMinion.atk + defMinion.tempAtkBonus;

      logs.push(makeLog(
        `${getCard(attackerMinion.cardId).name} (${actualAtk}/${attackerMinion.hp}) attacks ${getCard(defMinion.cardId).name} (${defAtk}/${defMinion.hp})`,
        'damage'
      ));

      // Apply damage simultaneously
      const attackerNewHp = attackerMinion.hp - defAtk;
      const defenderNewHp = defMinion.hp - actualAtk;

      newGs = setField(newGs, attackerOwner,
        getField(newGs, attackerOwner).map(m =>
          m.instanceId === attackerId ? { ...m, hp: attackerNewHp } : m
        )
      );
      newGs = setField(newGs, defenderOwner,
        getField(newGs, defenderOwner).map(m =>
          m.instanceId === defenderId ? { ...m, hp: defenderNewHp } : m
        )
      );

      // Venombrand: mark defender to die at end of round
      if (attackerHasVenombrand && defenderNewHp > 0) {
        newGs = setField(newGs, defenderOwner,
          getField(newGs, defenderOwner).map(m =>
            m.instanceId === defenderId ? { ...m, venomBranded: true } : m
          )
        );
        logs.push(makeLog('Venombrand: target marked to die at end of turn', 'effect'));
      }

      // Lifebond for attacker
      if (attackerHasLifebond) {
        newGs = setHero(newGs, attackerOwner, healHero(getHero(newGs, attackerOwner), actualAtk));
        logs.push(makeLog('Lifebond: Hero heals for ' + actualAtk, 'effect'));
      }

      // Blade Dance
      if (attackerHasBladeDance) {
        const bdDmg = Math.ceil(actualAtk / 2);
        const defEnemyField = getField(newGs, defenderOwner);
        // Find target: bulwark first, otherwise lowest HP
        let bdTarget: MinionState | undefined;
        const bulwark = defEnemyField.find(m => m.hasBulwark && !m.hasNullbind);
        if (bulwark) {
          bdTarget = bulwark;
        } else {
          bdTarget = [...defEnemyField].sort((a, b) => a.hp - b.hp)[0];
        }
        if (bdTarget) {
          newGs = setField(newGs, defenderOwner,
            getField(newGs, defenderOwner).map(m =>
              m.instanceId === bdTarget!.instanceId ? { ...m, hp: m.hp - bdDmg } : m
            )
          );
          logs.push(makeLog(`Blade Dance hits ${getCard(bdTarget.cardId).name} for ${bdDmg}`, 'effect'));
        }
      }

      // Sternenruferin: draw if kill
      if (attackerMinion.cardId === 'sternenruferin_mira' && defenderNewHp <= 0) {
        newGs = drawCard(newGs, attackerOwner, logs);
      }
    }

    // Mark attacker as attacked
    newGs = setField(newGs, attackerOwner,
      getField(newGs, attackerOwner).map(m =>
        m.instanceId === attackerId ? { ...m, hasAttackedThisTurn: true } : m
      )
    );
  }

  newGs = processDead(newGs, logs);
  return newGs;
}

// ---- Play a card ----
function playCard(
  gs: GameState,
  owner: PlayerId,
  handIndex: number,
  targetId?: string,
  targetOwner?: PlayerId | 'none',
  logs: GameLog[] = [],
): GameState {
  const hand = owner === 'player' ? gs.playerHand : gs.aiHand;
  const cardId = hand[handIndex];
  const def = getCard(cardId);
  let newGs = { ...gs };

  // Deduct aether
  if (owner === 'player') {
    newGs = { ...newGs, playerAether: newGs.playerAether - def.cost };
  } else {
    newGs = { ...newGs, aiAether: newGs.aiAether - def.cost };
  }

  // Remove from hand
  const newHand = [...hand];
  newHand.splice(handIndex, 1);
  if (owner === 'player') {
    newGs = { ...newGs, playerHand: newHand };
  } else {
    newGs = { ...newGs, aiHand: newHand };
  }

  logs.push(makeLog(`${owner === 'player' ? 'You play' : 'AI plays'} ${def.name}`, 'action'));

  if (def.type === 'minion') {
    const minion = minionFromCard(cardId, owner);
    const field = getField(newGs, owner);
    newGs = setField(newGs, owner, [...field, minion]);

    // Battlecry effects
    if (def.effects.includes('play_deal_1') && targetId) {
      // Flammenwirkerin: deal 1 to target
      newGs = applySpellDamage(newGs, owner, 1, targetId, targetOwner as PlayerId, logs);
    }
    if (def.effects.includes('draw_1')) {
      newGs = drawCard(newGs, owner, logs);
    }
    if (def.effects.includes('nullbind_enemy') && targetId) {
      newGs = applyNullbind(newGs, targetId, logs);
    }
    if (def.effects.includes('give_venombrand') && targetId) {
      newGs = applyGiveEffect(newGs, owner, targetId, 'hasVenombrand', logs, 'Venombrand');
    }
    if (def.effects.includes('remove_bulwark') && targetId) {
      // Schildbrecherin
      const enemyOwner = getEnemy(owner);
      newGs = setField(newGs, enemyOwner,
        getField(newGs, enemyOwner).map(m =>
          m.instanceId === targetId ? { ...m, hasBulwark: false } : m
        )
      );
      logs.push(makeLog('Bulwark removed!', 'effect'));
    }
    if (def.effects.includes('summon_wolf')) {
      // Summon a 2/2 wolf
      const wolf: MinionState = {
        instanceId: newId('wolf'),
        cardId: 'wolf_token',
        atk: 2, hp: 2, maxHp: 2,
        hasSurge: false, hasBulwark: false, hasVenombrand: false,
        hasLifebond: false, hasExecutionMark: false, hasNullbind: false,
        hasBladeDance: false, hasAttackedThisTurn: false, justPlayed: true,
        venomBranded: false, tempAtkBonus: 0, owner,
      };
      newGs = setField(newGs, owner, [...getField(newGs, owner), wolf]);
      logs.push(makeLog('A 2/2 Wolf joins the field!', 'effect'));
    }
  } else if (def.type === 'weapon') {
    const weapon: WeaponState = {
      cardId: def.id,
      atk: def.atk ?? 0,
      durability: def.durability ?? 1,
      hasExecutionMark: def.effects.includes('weapon_execution_mark'),
      hasSurge: def.effects.includes('surge'),
      hasLifebond: def.effects.includes('weapon_lifebond'),
      hasAllyAtk: def.effects.includes('weapon_ally_atk'),
      hasAttackedThisTurn: false,
      justEquipped: !def.effects.includes('surge'),
    };
    const hero = getHero(newGs, owner);
    newGs = setHero(newGs, owner, { ...hero, weapon });
    logs.push(makeLog(`${def.name} equipped (${weapon.atk} ATK, ${weapon.durability} durability)`, 'action'));
  } else {
    // Spell
    newGs = { ...newGs, spellsCastThisTurn: newGs.spellsCastThisTurn + 1 };

    // Spell cast: arkanfunke gets +1 atk
    const field = getField(newGs, owner);
    const arkanfunke = field.find(m => m.cardId === 'arkanfunke_lehrling');
    if (arkanfunke) {
      newGs = setField(newGs, owner, field.map(m =>
        m.cardId === 'arkanfunke_lehrling' ? { ...m, tempAtkBonus: m.tempAtkBonus + 1 } : m
      ));
      logs.push(makeLog('Arkanfunke Lehrling: +1 ATK this turn', 'effect'));
    }

    if (def.effects.includes('draw2_discard1')) {
      newGs = drawCard(newGs, owner, logs);
      newGs = drawCard(newGs, owner, logs);
      // Discard is handled separately (player input needed)
      // For AI: discard highest cost card
      if (owner === 'ai') {
        const aiHand = newGs.aiHand;
        if (aiHand.length > 0) {
          const discardIdx = aiHand.reduce((best, id, i) =>
            getCard(id).cost > getCard(aiHand[best]).cost ? i : best, 0);
          const newAiHand = [...aiHand];
          const discarded = newAiHand.splice(discardIdx, 1)[0];
          newGs = { ...newGs, aiHand: newAiHand, aiGraveyard: [...newGs.aiGraveyard, discarded] };
          logs.push(makeLog(`AI discards ${getCard(discarded).name}`, 'action'));
        }
      }
    }
    if (def.effects.includes('deal_1_any') && targetId) {
      newGs = applySpellDamage(newGs, owner, 1, targetId, targetOwner as PlayerId, logs);
    }
    if (def.effects.includes('deal_2_any') && targetId) {
      newGs = applySpellDamage(newGs, owner, 2, targetId, targetOwner as PlayerId, logs);
    }
    if (def.effects.includes('deal_5_any') && targetId) {
      newGs = applySpellDamage(newGs, owner, 5, targetId, targetOwner as PlayerId, logs);
    }
    if (def.effects.includes('nullbind_1dmg') && targetId) {
      newGs = applyNullbind(newGs, targetId, logs);
      newGs = applySpellDamage(newGs, owner, 1, targetId, targetOwner as PlayerId, logs);
    }
    if (def.effects.includes('flammenflut')) {
      const enemyOwner = getEnemy(owner);
      const enemyField = getField(newGs, enemyOwner).map(m => ({ ...m, hp: m.hp - 1 }));
      newGs = setField(newGs, enemyOwner, enemyField);
      logs.push(makeLog('Flammenflut: 1 damage to all enemy minions', 'effect'));
    }
    if (def.effects.includes('give_surge') && targetId) {
      newGs = applyGiveEffect(newGs, owner, targetId, 'hasSurge', logs, 'Surge');
      // Also clear justPlayed so they can attack
      newGs = setField(newGs, owner,
        getField(newGs, owner).map(m =>
          m.instanceId === targetId ? { ...m, hasSurge: true, justPlayed: false } : m
        )
      );
    }
    if (def.effects.includes('arkaner_schwur') && targetId) {
      newGs = applySpellDamage(newGs, owner, 3, targetId, targetOwner as PlayerId, logs);
      newGs = setHero(newGs, owner, healHero(getHero(newGs, owner), 1));
      logs.push(makeLog('Arkaner Schwur: Hero heals 1', 'effect'));
    }
    if (def.effects.includes('remove_bulwark') && targetId) {
      const enemyOwner = getEnemy(owner);
      newGs = setField(newGs, enemyOwner,
        getField(newGs, enemyOwner).map(m =>
          m.instanceId === targetId ? { ...m, hasBulwark: false } : m
        )
      );
      logs.push(makeLog('Bannkreis: Bulwark removed!', 'effect'));
    }
    if (def.effects.includes('nullbind_enemy') && targetId) {
      newGs = applyNullbind(newGs, targetId, logs);
    }
    if (def.effects.includes('eisenmut') && targetId) {
      newGs = setField(newGs, owner,
        getField(newGs, owner).map(m =>
          m.instanceId === targetId ? { ...m, hp: m.hp + 2, maxHp: m.maxHp + 2 } : m
        )
      );
      logs.push(makeLog('Eisenmut: +2 HP', 'effect'));
    }
    if (def.effects.includes('blutgebrüll')) {
      const enemyOwner = getEnemy(owner);
      newGs = setHero(newGs, enemyOwner, applyDamageToHero(getHero(newGs, enemyOwner), 3));
      newGs = setHero(newGs, owner, applyDamageToHero(getHero(newGs, owner), 1));
      logs.push(makeLog('Blutgebrüll: 3 dmg to enemy hero, 1 dmg to self', 'damage'));
    }

    // Add to graveyard
    if (owner === 'player') {
      newGs = { ...newGs, playerGraveyard: [...newGs.playerGraveyard, cardId] };
    } else {
      newGs = { ...newGs, aiGraveyard: [...newGs.aiGraveyard, cardId] };
    }
  }

  newGs = processDead(newGs, logs);
  return newGs;
}

function applyNullbind(gs: GameState, targetId: string, logs: GameLog[]): GameState {
  for (const owner of ['player', 'ai'] as PlayerId[]) {
    const field = getField(gs, owner);
    const found = field.find(m => m.instanceId === targetId);
    if (found) {
      logs.push(makeLog(`${getCard(found.cardId).name} is Nullbound for this turn`, 'effect'));
      return setField(gs, owner, field.map(m =>
        m.instanceId === targetId ? { ...m, hasNullbind: true } : m
      ));
    }
  }
  return gs;
}

function applyGiveEffect(
  gs: GameState,
  owner: PlayerId,
  targetId: string,
  prop: keyof MinionState,
  logs: GameLog[],
  effectName: string,
): GameState {
  const field = getField(gs, owner);
  const found = field.find(m => m.instanceId === targetId);
  if (!found) return gs;
  logs.push(makeLog(`${getCard(found.cardId).name} gains ${effectName}`, 'effect'));
  return setField(gs, owner, field.map(m =>
    m.instanceId === targetId ? { ...m, [prop]: true } : m
  ));
}

function applySpellDamage(
  gs: GameState,
  casterOwner: PlayerId,
  dmg: number,
  targetId: string,
  targetOwner: PlayerId,
  logs: GameLog[],
): GameState {
  if (targetId === 'hero') {
    const hero = applyDamageToHero(getHero(gs, targetOwner), dmg);
    logs.push(makeLog(`${dmg} spell damage to ${targetOwner} hero`, 'damage'));
    return setHero(gs, targetOwner, hero);
  } else {
    let found = false;
    for (const o of ['player', 'ai'] as PlayerId[]) {
      const field = getField(gs, o);
      const minion = field.find(m => m.instanceId === targetId);
      if (minion) {
        found = true;
        logs.push(makeLog(`${dmg} spell damage to ${getCard(minion.cardId).name}`, 'damage'));
        return setField(gs, o, field.map(m =>
          m.instanceId === targetId ? { ...m, hp: m.hp - dmg } : m
        ));
      }
    }
    return gs;
  }
}

// ---- Hero abilities ----
function useHeroAbility(gs: GameState, owner: PlayerId, logs: GameLog[]): GameState {
  let newGs = { ...gs };
  // Costs 1 aether
  if (owner === 'player') {
    newGs = { ...newGs, playerAether: newGs.playerAether - 1 };
  } else {
    newGs = { ...newGs, aiAether: newGs.aiAether - 1 };
  }
  const hero = getHero(newGs, owner);
  newGs = setHero(newGs, owner, { ...hero, heroAbilityUsedThisTurn: true });

  const enemyOwner = getEnemy(owner);
  if (owner === 'player' && gs.playerField.length === 0 && gs.aiField.length === 0) {
    // Default: hero ability for deck A = deal 1 damage to enemy hero
    // but we need to know which deck player picked
    // We'll do ability based on which hero they're using - track by deck
  }

  // Deck A hero (Aetherflare): Deal 1 damage to any target (we'll deal to enemy hero for AI simplicity)
  // For now: player using deck A: deal 1 damage to random enemy
  // Player using deck B: gain +1 ATK this turn (if weapon)
  // We'll detect which by checking which deck player used - approximation: check cards in graveyard/deck
  const deckIsA = newGs.playerDeck.some(id => {
    try { return getCard(id).deck === 'A'; } catch { return false; }
  }) || newGs.playerField.some(m => {
    try { return getCard(m.cardId).deck === 'A'; } catch { return false; }
  });

  if (owner === 'player') {
    if (deckIsA) {
      // Aetherflare hero ability: 1 damage to enemy hero
      newGs = setHero(newGs, enemyOwner, applyDamageToHero(getHero(newGs, enemyOwner), 1));
      logs.push(makeLog('Hero Ability: 1 damage to enemy hero', 'effect'));
    } else {
      // Ironfang hero ability: hero gains +1 HP
      newGs = setHero(newGs, owner, healHero(getHero(newGs, owner), 2));
      logs.push(makeLog('Hero Ability: Heal 2 HP', 'effect'));
    }
  } else {
    // AI hero ability: same
    const aiDeckIsA = newGs.aiDeck.some(id => {
      try { return getCard(id).deck === 'A'; } catch { return false; }
    }) || newGs.aiField.some(m => {
      try { return getCard(m.cardId).deck === 'A'; } catch { return false; }
    });
    if (aiDeckIsA) {
      newGs = setHero(newGs, getEnemy(owner), applyDamageToHero(getHero(newGs, getEnemy(owner)), 1));
      logs.push(makeLog('AI Hero Ability: 1 damage to your hero', 'effect'));
    } else {
      newGs = setHero(newGs, owner, healHero(getHero(newGs, owner), 2));
      logs.push(makeLog('AI Hero Ability: Heal 2 HP', 'effect'));
    }
  }

  return newGs;
}

// ---- Start of turn ----
function startTurn(gs: GameState, owner: PlayerId, logs: GameLog[]): GameState {
  let newGs = { ...gs };
  const newMax = Math.min(8, (owner === 'player' ? newGs.playerMaxAether : newGs.aiMaxAether) + 1);

  if (owner === 'player') {
    newGs = { ...newGs, playerMaxAether: newMax, playerAether: newMax };
  } else {
    newGs = { ...newGs, aiMaxAether: newMax, aiAether: newMax };
  }

  // Refresh minions
  let field = getField(newGs, owner);
  field = field.map(m => ({
    ...m,
    hasAttackedThisTurn: false,
    justPlayed: false,
    hasNullbind: false,
    tempAtkBonus: 0,
  }));
  newGs = setField(newGs, owner, field);

  // Refresh weapon
  const hero = getHero(newGs, owner);
  if (hero.weapon) {
    newGs = setHero(newGs, owner, {
      ...hero,
      weapon: { ...hero.weapon, hasAttackedThisTurn: false, justEquipped: false },
      heroAbilityUsedThisTurn: false,
    });
  } else {
    newGs = setHero(newGs, owner, { ...hero, heroAbilityUsedThisTurn: false });
  }

  // Kriegshorn: +1 atk to team at start of turn
  const kriegshorn = field.find(m => m.cardId === 'kriegshorn_rufer' && !m.hasNullbind);
  if (kriegshorn) {
    newGs = setField(newGs, owner,
      getField(newGs, owner).map(m => ({ ...m, tempAtkBonus: m.tempAtkBonus + 1 }))
    );
    logs.push(makeLog('Kriegshorn Rufer: +1 ATK to all friendly minions this turn', 'effect'));
  }

  // Draw a card
  newGs = drawCard(newGs, owner, logs);

  newGs = { ...newGs, spellsCastThisTurn: 0 };
  logs.push(makeLog(`--- ${owner === 'player' ? 'Your' : "AI's"} Turn (Round ${newGs.round}) ---`, 'system'));

  return newGs;
}

// ---- End of turn ----
function endTurn(gs: GameState, owner: PlayerId, logs: GameLog[]): GameState {
  let newGs = { ...gs };

  // Process venombrand deaths
  for (const o of ['player', 'ai'] as PlayerId[]) {
    const field = getField(newGs, o);
    const branded = field.filter(m => m.venomBranded);
    if (branded.length > 0) {
      newGs = setField(newGs, o, field.map(m => m.venomBranded ? { ...m, hp: 0 } : m));
      for (const b of branded) {
        logs.push(makeLog(`${getCard(b.cardId).name} dies from Venombrand!`, 'death'));
      }
      newGs = processDead(newGs, logs);
    }
  }

  // Check empty deck/hand/field lose condition
  const nextOwner = getEnemy(owner);
  // (Check at end of opponent's turn, not here)

  return newGs;
}

// ---- Main reducer ----
export function gameReducer(gs: GameState, action: GameAction): GameState {
  const logs: GameLog[] = [];
  let newGs = { ...gs };

  switch (action.type) {
    case 'START_GAME': {
      instanceCounter = 0;
      const playerDeck = buildDeckInstances(action.playerDeck);
      const aiDeck = buildDeckInstances(action.aiDeck);
      const pHand = playerDeck.slice(0, 5);
      const aHand = aiDeck.slice(0, 5);
      return {
        phase: 'start',
        activePlayer: 'player',
        round: 1,
        turnNumber: 1,
        mulliganSelectedIndices: [],
        playerHero: makeHero(),
        playerHand: pHand,
        playerDeck: playerDeck.slice(5),
        playerField: [],
        playerGraveyard: [],
        playerAether: 0,
        playerMaxAether: 0,
        aiHero: makeHero(),
        aiHand: aHand,
        aiDeck: aiDeck.slice(5),
        aiField: [],
        aiGraveyard: [],
        aiAether: 0,
        aiMaxAether: 0,
        spellsCastThisTurn: 0,
        selectionPending: null,
        selectedCardIndex: null,
        selectedMinionId: null,
        logs: [makeLog('Game started! Mulligan phase.', 'system')],
        winner: null,
        winReason: '',
        aiThinking: false,
      };
    }

    case 'MULLIGAN_TOGGLE': {
      const idx = action.index;
      const current = gs.mulliganSelectedIndices;
      const newIndices = current.includes(idx)
        ? current.filter(i => i !== idx)
        : current.length < 3 ? [...current, idx] : current;
      return { ...gs, mulliganSelectedIndices: newIndices };
    }

    case 'MULLIGAN_CONFIRM': {
      let newGs2 = { ...gs };
      const toReplace = gs.mulliganSelectedIndices.sort((a, b) => b - a);
      let deck = [...gs.playerDeck];
      let hand = [...gs.playerHand];
      for (const idx of toReplace) {
        const card = hand[idx];
        deck.push(card);
        deck = shuffle(deck);
        const drawn = deck.shift()!;
        hand[idx] = drawn;
      }
      newGs2 = { ...newGs2, playerHand: hand, playerDeck: deck, mulliganSelectedIndices: [] };

      // AI mulligan: replace 2 most expensive cards
      let aiHand = [...newGs2.aiHand];
      let aiDeck = [...newGs2.aiDeck];
      const aiExpensive = [...aiHand]
        .map((id, i) => ({ id, i, cost: getCard(id).cost }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 2);
      for (const { i } of aiExpensive) {
        aiDeck.push(aiHand[i]);
        aiDeck = shuffle(aiDeck);
        aiHand[i] = aiDeck.shift()!;
      }
      newGs2 = { ...newGs2, aiHand, aiDeck };

      // Start game - player goes first
      newGs2 = startTurn(newGs2, 'player', logs);
      newGs2 = {
        ...newGs2,
        phase: 'player_turn',
        logs: [...newGs2.logs, ...logs],
      };
      return newGs2;
    }

    case 'SELECT_HAND_CARD': {
      if (gs.phase !== 'player_turn') return gs;
      if (gs.selectionPending) return gs;
      const cardId = gs.playerHand[action.index];
      const def = getCard(cardId);

      // Check if we can afford it
      if (def.cost > gs.playerAether) {
        return { ...gs, selectedCardIndex: action.index, selectedMinionId: null };
      }

      // Determine if spell needs a target
      const needsTarget = needsTargetSelection(def);
      if (needsTarget) {
        return {
          ...gs,
          selectedCardIndex: action.index,
          selectedMinionId: null,
          selectionPending: { type: needsTarget, sourceCardId: cardId },
        };
      }

      // Play immediately (no target needed)
      newGs = playCard(newGs, 'player', action.index, undefined, undefined, logs);
      newGs = checkWin(newGs, logs);
      return { ...newGs, selectedCardIndex: null, selectedMinionId: null, logs: [...newGs.logs, ...logs] };
    }

    case 'SELECT_TARGET': {
      if (!gs.selectionPending) return gs;
      const pending = gs.selectionPending;
      newGs = { ...gs, selectionPending: null };

      if (pending.type === 'aetherladung_discard') {
        // Discard the selected card
        const hand = [...newGs.playerHand];
        const discarded = hand.splice(action.targetId as unknown as number, 1)[0];
        newGs = {
          ...newGs,
          playerHand: hand,
          playerGraveyard: [...newGs.playerGraveyard, discarded],
          selectedCardIndex: null,
          selectedMinionId: null,
          logs: [...newGs.logs, makeLog(`You discard ${getCard(discarded).name}`, 'action')],
        };
        return newGs;
      }

      const handIdx = gs.selectedCardIndex!;
      // Re-find the card index since we cleared selectedCardIndex before
      const realHandIdx = handIdx;

      newGs = playCard(newGs, 'player', realHandIdx, action.targetId, action.targetOwner, logs);
      newGs = checkWin(newGs, logs);

      // Aetherladung draw2_discard1: after draw, need to discard
      if (gs.playerHand[realHandIdx] && getCard(gs.playerHand[realHandIdx])?.effects.includes('draw2_discard1')) {
        // Already handled in playCard
      }

      return { ...newGs, selectedCardIndex: null, selectedMinionId: null, logs: [...newGs.logs, ...logs] };
    }

    case 'PLAY_CARD': {
      if (gs.phase !== 'player_turn') return gs;
      const def = getCard(gs.playerHand[action.handIndex]);
      if (def.cost > gs.playerAether) return gs;
      newGs = playCard(newGs, 'player', action.handIndex, action.targetId, undefined, logs);
      newGs = checkWin(newGs, logs);

      // Handle draw2_discard1 discard
      if (def.effects.includes('draw2_discard1') && newGs.playerHand.length > 0) {
        return {
          ...newGs,
          selectedCardIndex: null,
          selectionPending: { type: 'aetherladung_discard' },
          logs: [...newGs.logs, ...logs, makeLog('Choose a card to discard', 'system')],
        };
      }

      return { ...newGs, selectedCardIndex: null, selectedMinionId: null, logs: [...newGs.logs, ...logs] };
    }

    case 'SELECT_MINION': {
      if (gs.phase !== 'player_turn') return gs;
      if (gs.selectionPending) return gs;
      return { ...gs, selectedMinionId: action.instanceId, selectedCardIndex: null };
    }

    case 'ATTACK_WITH_MINION': {
      if (gs.phase !== 'player_turn') return gs;
      const attacker = gs.playerField.find(m => m.instanceId === action.attackerId);
      if (!attacker) return gs;
      if (attacker.hasAttackedThisTurn || (attacker.justPlayed && !attacker.hasSurge)) return gs;
      if (attacker.hasNullbind) return gs;

      // Check bulwark
      const bulwark = getBulwarkMinion(newGs, action.targetOwner);
      let finalTargetId = action.targetId;
      if (bulwark && action.targetId !== bulwark.instanceId && action.targetId !== 'hero') {
        finalTargetId = bulwark.instanceId;
      }
      if (bulwark && action.targetId === 'hero') {
        finalTargetId = bulwark.instanceId;
      }

      newGs = doAttack(newGs, 'player', action.attackerId, action.targetOwner, finalTargetId, logs);
      newGs = checkWin(newGs, logs);
      return { ...newGs, selectedMinionId: null, logs: [...newGs.logs, ...logs] };
    }

    case 'ATTACK_WITH_HERO': {
      if (gs.phase !== 'player_turn') return gs;
      const weapon = gs.playerHero.weapon;
      if (!weapon || weapon.hasAttackedThisTurn || (weapon.justEquipped && !weapon.hasSurge)) return gs;

      const bulwark = getBulwarkMinion(newGs, action.targetOwner);
      let finalTargetId = action.targetId;
      if (bulwark && action.targetId !== bulwark.instanceId && action.targetId !== 'hero') {
        finalTargetId = bulwark.instanceId;
      }
      if (bulwark && action.targetId === 'hero') {
        finalTargetId = bulwark.instanceId;
      }

      newGs = doAttack(newGs, 'player', 'hero', action.targetOwner, finalTargetId, logs);
      newGs = checkWin(newGs, logs);
      return { ...newGs, selectedMinionId: null, logs: [...newGs.logs, ...logs] };
    }

    case 'USE_HERO_ABILITY': {
      if (gs.phase !== 'player_turn') return gs;
      if (gs.playerAether < 1 || gs.playerHero.heroAbilityUsedThisTurn) return gs;
      newGs = useHeroAbility(newGs, 'player', logs);
      newGs = checkWin(newGs, logs);
      return { ...newGs, logs: [...newGs.logs, ...logs] };
    }

    case 'DISCARD_CARD': {
      if (!gs.selectionPending || gs.selectionPending.type !== 'aetherladung_discard') return gs;
      const hand = [...gs.playerHand];
      const discarded = hand.splice(action.handIndex, 1)[0];
      return {
        ...gs,
        playerHand: hand,
        playerGraveyard: [...gs.playerGraveyard, discarded],
        selectionPending: null,
        selectedCardIndex: null,
        logs: [...gs.logs, makeLog(`You discard ${getCard(discarded).name}`, 'action')],
      };
    }

    case 'END_TURN': {
      if (gs.phase !== 'player_turn') return gs;
      newGs = endTurn(newGs, 'player', logs);
      newGs = checkWin(newGs, logs);
      if (newGs.phase === 'game_over') return { ...newGs, logs: [...newGs.logs, ...logs] };

      newGs = { ...newGs, phase: 'ai_turn', activePlayer: 'ai', round: newGs.round + 1, aiThinking: true };
      return { ...newGs, selectedCardIndex: null, selectedMinionId: null, selectionPending: null, logs: [...newGs.logs, ...logs] };
    }

    case 'AI_ACTION': {
      if (gs.phase !== 'ai_turn') return gs;
      newGs = runAITurn(newGs, logs);
      newGs = checkWin(newGs, logs);

      if (newGs.phase !== 'game_over') {
        newGs = endTurn(newGs, 'ai', logs);
        newGs = checkWin(newGs, logs);
        if (newGs.phase !== 'game_over') {
          newGs = startTurn(newGs, 'player', logs);
          newGs = { ...newGs, phase: 'player_turn', activePlayer: 'player', aiThinking: false };
        }
      }

      return { ...newGs, aiThinking: false, logs: [...newGs.logs, ...logs] };
    }

    default:
      return gs;
  }
}

function needsTargetSelection(def: CardDef): SelectionPending['type'] | null {
  for (const eff of def.effects) {
    if (['deal_1_any', 'deal_2_any', 'deal_5_any', 'arkaner_schwur'].includes(eff)) return 'spell_target_any';
    if (['nullbind_enemy', 'nullbind_1dmg'].includes(eff)) return 'spell_target_enemy';
    if (['give_surge', 'eisenmut', 'give_venombrand'].includes(eff)) return 'spell_target_friendly';
    if (eff === 'remove_bulwark') return 'spell_target_enemy';
    if (eff === 'play_deal_1') return 'spell_target_any'; // Flammenwirkerin battlecry
    if (eff === 'nullbind_enemy') return 'spell_target_enemy';
  }
  return null;
}

// ---- Simple AI ----
function runAITurn(gs: GameState, logs: GameLog[]): GameState {
  let newGs = startTurn(gs, 'ai', logs);
  newGs = { ...newGs, phase: 'ai_turn' };

  // Play cards (greedy: most expensive affordable first, prefer minions)
  let playedSomething = true;
  while (playedSomething) {
    playedSomething = false;
    const hand = newGs.aiHand;
    // Sort by cost descending, preferring minions
    const playable = hand
      .map((id, i) => ({ id, i, def: getCard(id) }))
      .filter(({ def }) => def.cost <= newGs.aiAether)
      .sort((a, b) => b.def.cost - a.def.cost);

    if (playable.length === 0) break;

    const { i, def } = playable[0];

    // Choose target for spells that need them
    let targetId: string | undefined;
    let targetOwner: PlayerId | undefined;

    if (def.type === 'spell' || (def.type === 'minion' && needsTargetSelection(def))) {
      const selType = needsTargetSelection(def);
      if (selType === 'spell_target_any' || selType === 'spell_target_enemy') {
        // Target: prefer player minions with lowest HP, else player hero
        const playerField = newGs.playerField;
        if (playerField.length > 0) {
          const target = [...playerField].sort((a, b) => a.hp - b.hp)[0];
          targetId = target.instanceId;
          targetOwner = 'player';
        } else {
          targetId = 'hero';
          targetOwner = 'player';
        }
      } else if (selType === 'spell_target_friendly') {
        const aiField = newGs.aiField;
        if (aiField.length === 0) { continue; }
        // Give to highest ATK
        const target = [...aiField].sort((a, b) => b.atk - a.atk)[0];
        targetId = target.instanceId;
        targetOwner = 'ai';
      } else if (selType === 'play_deal_1') {
        const playerField = newGs.playerField;
        if (playerField.length > 0) {
          targetId = playerField[0].instanceId;
          targetOwner = 'player';
        } else {
          targetId = 'hero';
          targetOwner = 'player';
        }
      }
    }

    // Handle draw2_discard1 - AI will discard highest cost remaining card after
    newGs = playCard(newGs, 'ai', i, targetId, targetOwner, logs);
    newGs = checkWin(newGs, logs);
    if (newGs.phase === 'game_over') return newGs;
    playedSomething = true;
  }

  // Attack with minions
  const doAttacks = () => {
    let attacked = true;
    while (attacked) {
      attacked = false;
      const field = newGs.aiField;
      const canAttack = field.filter(m =>
        !m.hasAttackedThisTurn &&
        !m.hasNullbind &&
        !(m.justPlayed && !m.hasSurge)
      );
      if (canAttack.length === 0) break;

      for (const attacker of canAttack) {
        // Choose target: bulwark first, then lowest HP minion, else hero
        const playerField = newGs.playerField;
        const bulwark = getBulwarkMinion(newGs, 'player');
        let targetId: string;
        let targetOwner: PlayerId = 'player';

        if (bulwark) {
          targetId = bulwark.instanceId;
        } else if (playerField.length > 0) {
          // If execution mark, prefer target with <=2 hp
          if (attacker.hasExecutionMark) {
            const weakTarget = playerField.find(m => m.hp <= 2);
            if (weakTarget) {
              targetId = weakTarget.instanceId;
            } else {
              targetId = [...playerField].sort((a, b) => a.hp - b.hp)[0].instanceId;
            }
          } else {
            targetId = [...playerField].sort((a, b) => a.hp - b.hp)[0].instanceId;
          }
        } else {
          targetId = 'hero';
        }

        newGs = doAttack(newGs, 'ai', attacker.instanceId, targetOwner, targetId, logs);
        newGs = checkWin(newGs, logs);
        if (newGs.phase === 'game_over') return;
        attacked = true;
        break; // re-evaluate after each attack
      }
    }
  };
  doAttacks();

  // Attack with hero if has weapon
  const aiWeapon = newGs.aiHero.weapon;
  if (aiWeapon && !aiWeapon.hasAttackedThisTurn && !(aiWeapon.justEquipped && !aiWeapon.hasSurge)) {
    const playerField = newGs.playerField;
    const bulwark = getBulwarkMinion(newGs, 'player');
    let targetId: string;
    let targetOwner: PlayerId = 'player';

    if (bulwark) {
      targetId = bulwark.instanceId;
    } else if (playerField.length > 0) {
      targetId = [...playerField].sort((a, b) => a.hp - b.hp)[0].instanceId;
    } else {
      targetId = 'hero';
    }

    newGs = doAttack(newGs, 'ai', 'hero', targetOwner, targetId, logs);
    newGs = checkWin(newGs, logs);
  }

  // Use hero ability if affordable
  if (newGs.aiAether >= 1 && !newGs.aiHero.heroAbilityUsedThisTurn) {
    newGs = useHeroAbility(newGs, 'ai', logs);
    newGs = checkWin(newGs, logs);
  }

  return newGs;
}
