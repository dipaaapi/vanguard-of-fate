import { Sound } from "./audio.js";
import { EQUIPMENT_DB, EquipmentManager, SUCCESS_RATES, ENHANCE_COSTS, MONSTER_LOOT_TABLE } from "./equipment.js";
import { QUEST_ARCS } from "./quest.js";
import { ISEKAI_LORE } from "./select.js";

export class UIManager {
  constructor() {
    this.buttons = {
      lore: { x: 388, y: 7, w: 16, h: 14 },
      pause: { x: 406, y: 7, w: 14, h: 14 },
      questLog: { x: 340, y: 55, w: 76, h: 14 }
    };
    this.shopTab = "BUY"; // "BUY", "FORGE", "SELL"
    this.shopSelectedIdx = 0;
    this.forgeSelectedSlot = "weapon"; // "weapon", "armor", "accessory"
    this.forgeFeedback = null;
    this.forgeFeedbackTimer = 0;
    this.loreTab = "HEROES"; // "HEROES", "ARCS"
    this.loreHeroIdx = 0;
    this.loreArcIdx = 0;
  }

  drawHUD(ctx, player, enemyManager, lootManager, stage, screenWidth, isPaused, timeOfDay, weatherType, isInBarracks, questManager = null) {
    if (!player) return;

    // ========================================================
    // 1. LEFT CARD: PLAYER PROFILE & STATUS BARS
    // ========================================================
    const cX = 6;
    const cY = 6;
    const cW = 126;
    const cH = 54;

    ctx.fillStyle = "rgba(10, 14, 23, 0.94)";
    ctx.fillRect(cX, cY, cW, cH);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.strokeRect(cX, cY, cW, cH);

    // Hero Portrait
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(cX + 4, cY + 4, 26, 26);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1;
    ctx.strokeRect(cX + 4, cY + 4, 26, 26);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText(player.heroData.name[0], cX + 17, cY + 22);

    // Name & Level
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 6.8px monospace";
    const displayName = (player.playerName || player.heroData.name).toUpperCase().slice(0, 9);
    ctx.fillText(displayName, cX + 34, cY + 8);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 6.5px monospace";
    ctx.fillText(`LV.${player.level}`, cX + 92, cY + 8);

    const barW = 86;
    const barX = cX + 34;

    // 1. HP BAR (Solid Red)
    const hpRatio = Math.max(0, Math.min(1, player.hp / player.maxHp));
    ctx.fillStyle = "#450a0a";
    ctx.fillRect(barX, cY + 11, barW, 4.5);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(barX, cY + 11, Math.round(hpRatio * barW), 4.5);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 4.5px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`HP ${Math.ceil(player.hp)}/${player.maxHp}`, barX + barW - 1, cY + 14.5);

    // 2. EXP BAR (Solid Yellow, positioned near HP)
    const expRatio = Math.max(0, Math.min(1, player.exp / (player.expNext || 100)));
    ctx.fillStyle = "#422006";
    ctx.fillRect(barX, cY + 17, barW, 3.5);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(barX, cY + 17, Math.round(expRatio * barW), 3.5);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 4px monospace";
    ctx.fillText(`EXP ${player.exp}/${player.expNext}`, barX + barW - 1, cY + 20);

    // 3. MANA BAR (Solid Blue)
    const curMana = player.mana !== undefined ? player.mana : 100;
    const maxMana = player.maxMana || 100;
    const manaRatio = Math.max(0, Math.min(1, curMana / maxMana));
    ctx.fillStyle = "#172554";
    ctx.fillRect(barX, cY + 22, barW, 3.5);
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(barX, cY + 22, Math.round(manaRatio * barW), 3.5);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 4px monospace";
    ctx.fillText(`MP ${Math.floor(curMana)}/${maxMana}`, barX + barW - 1, cY + 25);

    // 4. FATIGUE / STAMINA BAR (Solid White)
    const curFatigue = player.fatigue !== undefined ? player.fatigue : 100;
    const maxFatigue = player.maxFatigue || 100;
    const fatigueRatio = Math.max(0, Math.min(1, curFatigue / maxFatigue));
    ctx.fillStyle = "#334155";
    ctx.fillRect(barX, cY + 27, barW, 3.5);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(barX, cY + 27, Math.round(fatigueRatio * barW), 3.5);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 4px monospace";
    ctx.fillText(`STM ${Math.floor(curFatigue)}/${maxFatigue}`, barX + barW - 1, cY + 30);

    // Gold & Upgrade Stones
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 5.5px monospace";
    ctx.fillText(`🪙 ${player.gold}G`, cX + 6, cY + 39);

    ctx.fillStyle = "#c084fc";
    ctx.fillText(`🪨 ${player.upgradeStones || 0} Stones`, cX + 54, cY + 39);

    // Equipped Gear Badges
    const wpnName = player.equipment && player.equipment.weapon ? `WPN: +${player.equipment.weapon.plus || 0}` : "WPN: --";
    const armName = player.equipment && player.equipment.armor ? `ARM: +${player.equipment.armor.plus || 0}` : "ARM: --";
    const accName = player.equipment && player.equipment.accessory ? `ACC: +${player.equipment.accessory.plus || 0}` : "ACC: --";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "5px monospace";
    ctx.fillText(`${wpnName} | ${armName} | ${accName}`, cX + 6, cY + 49);

    // ========================================================
    // 2. CENTER PANEL: FIELD STATS & WEATHER BADGE
    // ========================================================
    const fX = Math.round(screenWidth / 2 - 58);
    const fY = 7;
    const fW = 116;
    const fH = 22;

    ctx.fillStyle = "rgba(10, 14, 23, 0.9)";
    ctx.fillRect(fX, fY, fW, fH);
    ctx.strokeStyle = "#334155";
    ctx.strokeRect(fX, fY, fW, fH);

    const foeCount = enemyManager ? enemyManager.enemies.filter((e) => e.isAlive).length : 0;
    const lootCount = lootManager && lootManager.items ? lootManager.items.length : 0;

    ctx.font = "6.5px monospace";
    ctx.fillStyle = "#f87171";
    ctx.fillText(`FOES:${foeCount}`, fX + 6, fY + 10);

    ctx.fillStyle = "#4ade80";
    ctx.fillText(`LOOT:${lootCount}`, fX + 62, fY + 10);

    const wIcon = weatherType === "STORM" ? "⛈️" : (weatherType === "RAIN" ? "🌧️" : (weatherType === "FOG" ? "🌫️" : "☀️"));
    ctx.fillStyle = weatherType === "CLEAR" ? "#38bdf8" : "#94a3b8";
    ctx.fillText(`${wIcon} ${weatherType}`, fX + 6, fY + 18);

    ctx.fillStyle = isInBarracks ? "#ffd166" : "#64748b";
    ctx.fillText(isInBarracks ? "🛡️ BARRACKS" : "⚔️ OUTLANDS", fX + 62, fY + 18);

    // ========================================================
    // 3. RIGHT PANEL: MINI-MAP, LORE, PAUSE & QUEST TRACKER
    // ========================================================
    const mapW = 56;
    const mapH = 42;
    const mapX = screenWidth - mapW - 36;
    const mapY = 7;

    ctx.fillStyle = "rgba(8, 12, 20, 0.92)";
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    if (stage) {
      const scaleX = mapW / stage.width;
      const scaleY = mapH / stage.height;

      if (stage.safeZone) {
        ctx.fillStyle = "rgba(255, 209, 102, 0.22)";
        ctx.fillRect(
          mapX + stage.safeZone.x * scaleX,
          mapY + stage.safeZone.y * scaleY,
          stage.safeZone.w * scaleX,
          stage.safeZone.h * scaleY
        );
      }

      if (enemyManager) {
        ctx.fillStyle = "#ef4444";
        enemyManager.enemies.forEach((e) => {
          if (e.isAlive) ctx.fillRect(mapX + e.x * scaleX, mapY + e.y * scaleY, 1.5, 1.5);
        });
      }

      if (lootManager && lootManager.items) {
        ctx.fillStyle = "#22c55e";
        lootManager.items.forEach((item) => {
          ctx.fillRect(mapX + item.x * scaleX, mapY + item.y * scaleY, 1.2, 1.2);
        });
      }

      // Draw Quest Waypoint on Radar Mini-Map
      if (questManager) {
        const q = questManager.getCurrentQuest();
        if (q && q.type === "locating" && q.progress < q.maxProgress) {
          ctx.fillStyle = "#ffd166";
          ctx.beginPath();
          ctx.arc(mapX + q.targetX * scaleX, mapY + q.targetY * scaleY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.fillStyle = "#00f0ff";
      ctx.fillRect(mapX + player.x * scaleX - 0.5, mapY + player.y * scaleY - 0.5, 2.5, 2.5);
    }

    // Lore Button [📜]
    const lb = this.buttons.lore;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(lb.x, lb.y, lb.w, lb.h);
    ctx.strokeStyle = "#38bdf8";
    ctx.strokeRect(lb.x, lb.y, lb.w, lb.h);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 6.5px monospace";
    ctx.textAlign = "center";
    ctx.fillText("📜", lb.x + lb.w / 2, lb.y + 10);

    // Pause Button [||]
    const pb = this.buttons.pause;
    ctx.fillStyle = isPaused ? "#ffd166" : "#1e293b";
    ctx.fillRect(pb.x, pb.y, pb.w, pb.h);
    ctx.strokeStyle = "#ffd166";
    ctx.strokeRect(pb.x, pb.y, pb.w, pb.h);

    ctx.fillStyle = isPaused ? "#111111" : "#ffd166";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillText(isPaused ? "▶" : "||", pb.x + pb.w / 2, pb.y + 10);

    // Live Quest Tracker Box (Under Minimap)
    if (questManager) {
      const q = questManager.getCurrentQuest();
      const arc = questManager.getCurrentArc();

      const qBoxX = screenWidth - 116;
      const qBoxY = 52;
      const qBoxW = 108;
      const qBoxH = 34;

      ctx.fillStyle = "rgba(10, 14, 23, 0.9)";
      ctx.fillRect(qBoxX, qBoxY, qBoxW, qBoxH);
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 1;
      ctx.strokeRect(qBoxX, qBoxY, qBoxW, qBoxH);

      ctx.textAlign = "left";
      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 5.8px monospace";
      ctx.fillText(arc ? `📜 ARC ${arc.id}: ${arc.title.split(':')[1] || arc.title}`.slice(0, 20) : "📜 QUEST TRACKER", qBoxX + 4, qBoxY + 9);

      if (q) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 5.5px monospace";
        ctx.fillText(`${q.title} [${q.progress}/${q.maxProgress}]`, qBoxX + 4, qBoxY + 18);

        ctx.fillStyle = q.progress >= q.maxProgress ? "#4ade80" : "#94a3b8";
        ctx.font = "5px monospace";
        const statusText = q.progress >= q.maxProgress ? "READY! PRESS [Q]" : (q.type === "locating" ? `DIST: ${Math.round(Math.hypot(player.x - q.targetX, player.y - q.targetY))}px` : q.desc.slice(0, 23));
        ctx.fillText(statusText, qBoxX + 4, qBoxY + 27);
      } else {
        ctx.fillStyle = "#4ade80";
        ctx.font = "5.5px monospace";
        ctx.fillText("ALL ARCS COMPLETE! ✨", qBoxX + 4, qBoxY + 20);
      }
    }

    // ========================================================
    // 4. BOTTOM ACTION DOCK
    // ========================================================
    const dockSlots = [
      { key: "[L-CLICK]", label: "ATTACK", cost: "FREE", cd: player.attackCooldownTimer || 0, maxCd: player.heroData.attackCooldown || 16, color: "#f87171" },
      { key: "[SPACE]", label: "DODGE", cost: "20 STM", cd: player.dashCooldownTimer || 0, maxCd: 18, color: "#ffffff" },
      { key: "[1 / K]", label: "SKILL 1", cost: "15 MP", cd: player.skill1CooldownTimer || 0, maxCd: player.heroData.skill1Cooldown || 180, color: "#ffd166" },
      { key: "[2 / L]", label: "SKILL 2", cost: "25 MP", cd: player.skill2CooldownTimer || 0, maxCd: player.heroData.skill2Cooldown || 240, color: "#4ade80" },
      { key: "[3 / U]", label: "SKILL 3", cost: "35 MP", cd: player.skill3CooldownTimer || 0, maxCd: player.heroData.skill3Cooldown || 300, color: "#c084fc" }
    ];

    const slotW = 42;
    const slotH = 17;
    const slotGap = 4;
    const totalDockW = dockSlots.length * slotW + (dockSlots.length - 1) * slotGap;
    const dockStartX = Math.round(screenWidth / 2 - totalDockW / 2);
    const dockY = 220;

    dockSlots.forEach((slot, idx) => {
      const sx = dockStartX + idx * (slotW + slotGap);
      const isReady = slot.cd <= 0;

      ctx.fillStyle = "rgba(10, 14, 23, 0.92)";
      ctx.fillRect(sx, dockY, slotW, slotH);

      ctx.strokeStyle = isReady ? slot.color : "#475569";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(sx, dockY, slotW, slotH);

      if (!isReady) {
        const cdRatio = Math.min(1, slot.cd / slot.maxCd);
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(sx, dockY, Math.round(slotW * cdRatio), slotH);

        ctx.fillStyle = "#facc15";
        ctx.font = "bold 7px monospace";
        ctx.textAlign = "center";
        const sec = (slot.cd / 60).toFixed(1);
        ctx.fillText(`${sec}s`, sx + slotW / 2, dockY + 11);
      } else {
        ctx.fillStyle = slot.color;
        ctx.font = "bold 6.5px monospace";
        ctx.textAlign = "center";
        ctx.fillText(slot.key, sx + slotW / 2, dockY + 7.5);

        ctx.fillStyle = "#ffffff";
        ctx.font = "5px monospace";
        ctx.fillText(slot.label, sx + slotW / 2, dockY + 14);
      }
    });
  }

  drawInWorldUI(ctx, player, questManager = null) {
    if (!player) return;

    // Draw Glowing Waypoint Beacon for Locating Quests
    if (questManager) {
      const q = questManager.getCurrentQuest();
      if (q && q.type === "locating" && q.progress < q.maxProgress) {
        ctx.save();
        const pulse = Math.sin(Date.now() * 0.006) * 4;
        const rad = (q.radius || 90) + pulse;

        // Ground Target Zone
        ctx.fillStyle = "rgba(255, 209, 102, 0.15)";
        ctx.beginPath();
        ctx.arc(q.targetX, q.targetY, rad, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(q.targetX, q.targetY, rad, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Central Altar Pillar
        ctx.fillStyle = "#ffd166";
        ctx.beginPath();
        ctx.arc(q.targetX, q.targetY, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 6.5px monospace";
        ctx.textAlign = "center";
        ctx.fillText("SCOUT WAYPOINT: " + q.title.toUpperCase(), q.targetX, q.targetY - 12);
        ctx.fillText("[STAND IN ZONE TO COMPLETE]", q.targetX, q.targetY - 4);
        ctx.restore();
      }
    }

    if (player.skillCooldownTimer > 0 && player.heroData.cooldown) {
      const barW = 16;
      const progress = (player.skillCooldownTimer / player.heroData.cooldown) * barW;
      ctx.fillStyle = "#111";
      ctx.fillRect(player.x + 2, player.y - 7, barW, 2);
      ctx.fillStyle = "#00f0ff";
      ctx.fillRect(player.x + 2, player.y - 7, barW - progress, 2);
    }

    if (player.heroData.id === "archer" && player.arrowCount !== undefined) {
      const dotY = player.y - 11;
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i < player.arrowCount ? "#52b788" : "#444";
        ctx.fillRect(player.x + 3 + i * 3, dotY, 2, 2.5);
      }
    }
  }

  // ========================================================
  // 5. EXPANDED MULTI-TAB SHOP, BLACKSMITH FORGE & LOOT SELLING
  // ========================================================
  drawShopModal(ctx, player, screenWidth, screenHeight) {
    const boxW = 320;
    const boxH = 175;
    const boxX = Math.round(screenWidth / 2 - boxW / 2);
    const boxY = Math.round(screenHeight / 2 - boxH / 2);

    ctx.fillStyle = "rgba(10, 14, 23, 0.96)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Title Bar
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 8.5px monospace";
    ctx.textAlign = "center";
    ctx.fillText("— EDGAR'S BAZAAR & MASTER BLACKSMITH —", screenWidth / 2, boxY + 14);

    // Navigation Tabs
    const tabs = [
      { id: "BUY", label: "[1] BUY ITEMS" },
      { id: "FORGE", label: "[2] FORGE (+15)" },
      { id: "SELL", label: "[3] SELL LOOT" }
    ];
    const tabW = 80;
    const tabStartX = boxX + 35;
    tabs.forEach((t, i) => {
      const tx = tabStartX + i * (tabW + 10);
      const isSel = this.shopTab === t.id;
      ctx.fillStyle = isSel ? "#ffd166" : "#1e293b";
      ctx.fillRect(tx, boxY + 22, tabW, 14);
      ctx.fillStyle = isSel ? "#111827" : "#94a3b8";
      ctx.font = "bold 6.5px monospace";
      ctx.fillText(t.label, tx + tabW / 2, boxY + 32);
    });

    // Tab Content Area
    if (this.shopTab === "BUY") {
      this.drawShopBuyTab(ctx, player, boxX, boxY, boxW, boxH);
    } else if (this.shopTab === "FORGE") {
      this.drawShopForgeTab(ctx, player, boxX, boxY, boxW, boxH);
    } else if (this.shopTab === "SELL") {
      this.drawShopSellTab(ctx, player, boxX, boxY, boxW, boxH);
    }

    // Bottom Footer Info
    ctx.fillStyle = "#64748b";
    ctx.font = "5.5px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`🪙 ${player.gold}G  |  🪨 ${player.upgradeStones || 0} Upgrade Stones  |  [ESC] Exit  |  [1/2/3] Switch Tabs`, screenWidth / 2, boxY + boxH - 6);
  }

  drawShopBuyTab(ctx, player, boxX, boxY, boxW, boxH) {
    const buyCatalog = [
      { id: "mat_stone", name: "Upgrade Stone (1x)", price: 40, icon: "🪨", hotkey: "4" },
      { id: "con_hp_potion", name: "Greater HP Potion (+60 HP)", price: 20, icon: "🧪", hotkey: "5" },
      { id: "con_mana_elixir", name: "Elixir of Focus (Reset CD)", price: 35, icon: "🧴", hotkey: "6" },
      { id: "con_speed_tonic", name: "Swiftstride Tonic (Speed)", price: 30, icon: "⚡", hotkey: "7" },
      { id: "con_cure_salve", name: "Purification Salve (Cure Status)", price: 15, icon: "🌿", hotkey: "8" }
    ];

    buyCatalog.forEach((item, idx) => {
      const iy = boxY + 46 + idx * 19;
      const canAfford = player.gold >= item.price;

      ctx.fillStyle = canAfford ? "#ffffff" : "#64748b";
      ctx.font = "6.5px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`[${item.hotkey}] ${item.icon} ${item.name}`, boxX + 18, iy + 8);

      ctx.textAlign = "right";
      ctx.fillStyle = canAfford ? "#ffd166" : "#ef4444";
      ctx.fillText(`${item.price}G [BUY]`, boxX + boxW - 20, iy + 8);
      ctx.textAlign = "left";
    });
  }

  drawShopForgeTab(ctx, player, boxX, boxY, boxW, boxH) {
    const slots = [
      { key: "4", slot: "weapon", name: "Equipped Weapon", item: player.equipment.weapon },
      { key: "5", slot: "armor", name: "Equipped Armor", item: player.equipment.armor },
      { key: "6", slot: "accessory", name: "Equipped Accessory", item: player.equipment.accessory }
    ];

    slots.forEach((s, idx) => {
      const sy = boxY + 44 + idx * 24;
      const isSelected = this.forgeSelectedSlot === s.slot;

      ctx.fillStyle = isSelected ? "rgba(255, 209, 102, 0.15)" : "rgba(30, 41, 59, 0.4)";
      ctx.fillRect(boxX + 16, sy, boxW - 32, 22);
      ctx.strokeStyle = isSelected ? "#ffd166" : "#334155";
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX + 16, sy, boxW - 32, 22);

      ctx.textAlign = "left";
      if (s.item) {
        const plus = s.item.plus || 0;
        const isMax = plus >= 15;
        const rate = SUCCESS_RATES[plus] || 5;
        const cost = ENHANCE_COSTS[plus] || { gold: 100, stones: 5 };

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 6.5px monospace";
        ctx.fillText(`[${s.key}] ${s.item.icon || "⚔️"} ${s.item.name} +${plus}`, boxX + 22, sy + 8);

        if (isMax) {
          ctx.fillStyle = "#ffd166";
          ctx.fillText("MAX +15 MASTERWORK! ✨", boxX + 22, sy + 17);
        } else {
          ctx.fillStyle = "#94a3b8";
          ctx.font = "5.5px monospace";
          ctx.fillText(`CHANCE: ${rate}% | COST: ${cost.gold}G + ${cost.stones} Stones`, boxX + 22, sy + 17);
          ctx.font = "6.5px monospace";

          ctx.textAlign = "right";
          ctx.fillStyle = (player.gold >= cost.gold && player.upgradeStones >= cost.stones) ? "#4ade80" : "#ef4444";
          ctx.fillText(`[FORGE]`, boxX + boxW - 24, sy + 13);
          ctx.textAlign = "left";
        }
      } else {
        ctx.fillStyle = "#64748b";
        ctx.fillText(`[${s.key}] Empty ${s.name} Slot`, boxX + 22, sy + 13);
      }
    });

    if (this.forgeFeedback) {
      ctx.fillStyle = this.forgeFeedback.success ? "#4ade80" : "#ef4444";
      ctx.font = "bold 6.5px monospace";
      ctx.textAlign = "center";
      ctx.fillText(this.forgeFeedback.message, boxX + boxW / 2, boxY + 128);
    }
  }

  drawShopSellTab(ctx, player, boxX, boxY, boxW, boxH) {
    const sellables = (player.inventory || []).filter(i => i.price || i.sellPrice);

    ctx.textAlign = "left";
    ctx.font = "6px monospace";

    if (sellables.length === 0) {
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "center";
      ctx.fillText("No sellable loot in inventory.", boxX + boxW / 2, boxY + 70);
      ctx.fillText("Defeat monsters in the wild to gather sellable materials!", boxX + boxW / 2, boxY + 86);
      return;
    }

    const maxShown = Math.min(4, sellables.length);
    for (let i = 0; i < maxShown; i++) {
      const item = sellables[i];
      const sy = boxY + 44 + i * 18;
      const sellVal = item.sellPrice || Math.round((item.price || 10) * 0.5) || 5;

      ctx.fillStyle = "#ffffff";
      ctx.fillText(`[${4 + i}] ${item.icon || "📦"} ${item.name}`, boxX + 18, sy + 8);

      ctx.fillStyle = "#ffd166";
      ctx.textAlign = "right";
      ctx.fillText(`+${sellVal}G [SELL]`, boxX + boxW - 20, sy + 8);
      ctx.textAlign = "left";
    }

    ctx.fillStyle = "#38bdf8";
    ctx.textAlign = "center";
    ctx.fillText("[9] QUICK-SELL ALL MONSTER LOOTS", boxX + boxW / 2, boxY + 126);
  }

  // ========================================================
  // 6. QUEST LOG & ACHIEVEMENT CHRONICLES MODAL ([Q] KEY)
  // ========================================================
  drawQuestLogModal(ctx, questManager, player, screenWidth, screenHeight) {
    const boxW = 330;
    const boxH = 186;
    const boxX = Math.round(screenWidth / 2 - boxW / 2);
    const boxY = Math.round(screenHeight / 2 - boxH / 2);

    ctx.fillStyle = "rgba(8, 12, 22, 0.98)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Title Bar
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("📜 VANGUARD'S QUEST & ACHIEVEMENT CHRONICLES 📜", screenWidth / 2, boxY + 14);

    // Navigation Tabs: [1] ACTIVE QUESTS vs [2] ACHIEVEMENTS
    const curTab = questManager ? (questManager.tab || "QUESTS") : "QUESTS";
    const tab1W = 100;
    const tab2W = 110;
    const t1X = boxX + 50;
    const t2X = boxX + 170;

    // Tab 1: Quests
    ctx.fillStyle = curTab === "QUESTS" ? "#ffd166" : "#1e293b";
    ctx.fillRect(t1X, boxY + 20, tab1W, 13);
    ctx.fillStyle = curTab === "QUESTS" ? "#0f172a" : "#94a3b8";
    ctx.font = "bold 6.5px monospace";
    ctx.fillText("[1] ACTIVE QUESTS", t1X + tab1W / 2, boxY + 29);

    // Tab 2: Achievements
    ctx.fillStyle = curTab === "ACHIEVEMENTS" ? "#ffd166" : "#1e293b";
    ctx.fillRect(t2X, boxY + 20, tab2W, 13);
    ctx.fillStyle = curTab === "ACHIEVEMENTS" ? "#0f172a" : "#94a3b8";
    ctx.font = "bold 6.5px monospace";
    ctx.fillText("[2] 🏆 ACHIEVEMENTS", t2X + tab2W / 2, boxY + 29);

    // Close Button [X]
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("✕", boxX + boxW - 14, boxY + 14);

    if (curTab === "QUESTS") {
      const arc = questManager ? questManager.getCurrentArc() : null;
      const q = questManager ? questManager.getCurrentQuest() : null;

      if (arc) {
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 7px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`CURRENT ARC: ${arc.title} (${arc.levelRange})`, boxX + 16, boxY + 44);

        ctx.fillStyle = "#cbd5e1";
        ctx.font = "6px monospace";
        ctx.fillText(arc.desc.slice(0, 56), boxX + 16, boxY + 54);

        arc.quests.forEach((subQ, idx) => {
          const qY = boxY + 63 + idx * 20;
          const isDone = questManager.completedQuestIds.has(subQ.id);
          const isCurrent = q && q.id === subQ.id;

          ctx.fillStyle = isCurrent ? "rgba(255, 209, 102, 0.18)" : (isDone ? "rgba(34, 197, 94, 0.12)" : "rgba(30, 41, 59, 0.45)");
          ctx.fillRect(boxX + 16, qY, boxW - 32, 17);
          ctx.strokeStyle = isCurrent ? "#ffd166" : (isDone ? "#22c55e" : "#334155");
          ctx.lineWidth = isCurrent ? 1.2 : 1;
          ctx.strokeRect(boxX + 16, qY, boxW - 32, 17);

          ctx.fillStyle = isDone ? "#4ade80" : (isCurrent ? "#ffffff" : "#94a3b8");
          ctx.font = "bold 6.5px monospace";
          ctx.fillText(`${subQ.title}: ${subQ.desc.slice(0, 30)}`, boxX + 22, qY + 8);

          ctx.textAlign = "right";
          const mark = isDone ? "✓ COMPLETED" : (isCurrent ? `[${q.progress}/${q.maxProgress}] ACTIVE` : "LOCKED");
          ctx.fillStyle = isDone ? "#4ade80" : (isCurrent ? "#ffd166" : "#64748b");
          ctx.fillText(mark, boxX + boxW - 22, qY + 8);
          ctx.textAlign = "left";

          ctx.fillStyle = "#94a3b8";
          ctx.font = "5.5px monospace";
          ctx.fillText(`REWARD: +${subQ.expReward} EXP  |  🪙 ${subQ.goldReward}G  |  🪨 ${subQ.stonesReward} Stones`, boxX + 22, qY + 14.5);
        });
      }

      if (q && q.progress >= q.maxProgress) {
        ctx.fillStyle = "#15803d";
        ctx.fillRect(boxX + 30, boxY + boxH - 20, boxW - 60, 16);
        ctx.strokeStyle = "#4ade80";
        ctx.strokeRect(boxX + 30, boxY + boxH - 20, boxW - 60, 16);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 7px monospace";
        ctx.textAlign = "center";
        ctx.fillText("CLAIM QUEST REWARD! [CLICK / ENTER / SPACE] ✨", screenWidth / 2, boxY + boxH - 9.5);
      } else {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "6px monospace";
        ctx.textAlign = "center";
        ctx.fillText("[1/2] Switch Tabs  |  [Q / ESC] Close Chronicles", screenWidth / 2, boxY + boxH - 8);
      }
    } else if (curTab === "ACHIEVEMENTS") {
      // Achievements Chart View (12 Arcs)
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 7px monospace";
      ctx.fillText("🏆 VANGUARD'S 12 ARC CONQUEST CHART", boxX + 16, boxY + 44);

      const achList = questManager ? (questManager.achievements || []) : [];
      const showCount = Math.min(6, achList.length);
      const maxUnl = questManager ? (questManager.maxUnlockedArcIndex || questManager.currentArcIndex || 0) : 0;

      for (let i = 0; i < showCount; i++) {
        const ach = achList[i];
        const aY = boxY + 54 + i * 19;
        const isConquered = ach.unlocked;
        const isAvailableToEmbark = i <= maxUnl;
        const isCurrentActive = questManager && questManager.currentArcIndex === i;

        ctx.fillStyle = isConquered ? "rgba(234, 179, 8, 0.15)" : (isCurrentActive ? "rgba(56, 189, 248, 0.2)" : (isAvailableToEmbark ? "rgba(30, 41, 59, 0.6)" : "rgba(15, 23, 42, 0.6)"));
        ctx.fillRect(boxX + 16, aY, boxW - 32, 16);
        ctx.strokeStyle = isCurrentActive ? "#38bdf8" : (isConquered ? "#ffd166" : (isAvailableToEmbark ? "#4ade80" : "#334155"));
        ctx.lineWidth = (isCurrentActive || isConquered) ? 1.2 : 1;
        ctx.strokeRect(boxX + 16, aY, boxW - 32, 16);

        ctx.fillStyle = isConquered ? "#ffd166" : (isCurrentActive ? "#38bdf8" : (isAvailableToEmbark ? "#ffffff" : "#64748b"));
        ctx.font = "bold 6.5px monospace";
        ctx.fillText(`${isConquered ? "🏆" : (isAvailableToEmbark ? "⚔️" : "🔒")} ${ach.title}`, boxX + 22, aY + 7.5);

        ctx.textAlign = "right";
        if (isConquered) {
          ctx.fillStyle = "#4ade80";
          ctx.fillText(`CONQUERED (${ach.unlockDate || "Done"})`, boxX + boxW - 22, aY + 7.5);
        } else if (isCurrentActive) {
          ctx.fillStyle = "#38bdf8";
          ctx.fillText("ACTIVE EXPEDITION", boxX + boxW - 22, aY + 7.5);
        } else if (isAvailableToEmbark) {
          ctx.fillStyle = "#4ade80";
          ctx.fillText("READY TO EMBARK [CLICK]", boxX + boxW - 22, aY + 7.5);
        } else {
          ctx.fillStyle = "#64748b";
          ctx.fillText("LOCKED", boxX + boxW - 22, aY + 7.5);
        }
        ctx.textAlign = "left";

        ctx.fillStyle = "#94a3b8";
        ctx.font = "5.5px monospace";
        ctx.fillText(`${ach.arcName} (${ach.levelRange})`, boxX + 22, aY + 13.5);
      }

      ctx.fillStyle = "#38bdf8";
      ctx.font = "6px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Click any unlocked Arc row to set as active quest expedition! ✨", screenWidth / 2, boxY + boxH - 8);
    }
  }

  buyShopItem(index, player, fx) {
    if (!player) return;

    if (this.shopTab === "BUY") {
      const buyMap = {
        "4": { id: "mat_stone", price: 40, isStone: true },
        "5": { id: "con_hp_potion", price: 20 },
        "6": { id: "con_mana_elixir", price: 35 },
        "7": { id: "con_speed_tonic", price: 30 },
        "8": { id: "con_cure_salve", price: 15 }
      };

      const item = buyMap[index];
      if (item) {
        // Status Check for Cure Salve: Player must have an abnormal status effect
        if (item.id === "con_cure_salve" && !player.hasAnyDebuff()) {
          if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 10, player.y - 6, "NO ABNORMAL STATUS EFFECT!", false, "#ef4444");
          if (Sound && Sound.playForgeFail) Sound.playForgeFail();
          return;
        }

        if (player.gold >= item.price) {
          player.gold -= item.price;
          if (item.isStone) {
            player.upgradeStones = (player.upgradeStones || 0) + 1;
            if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 10, player.y - 6, "+1 UPGRADE STONE", true, "#a855f7");
          } else {
            const template = EQUIPMENT_DB[item.id];
            if (template && player.inventory) {
              player.inventory.push({
                ...template,
                uid: "con_" + Math.random().toString(36).substring(2, 9),
                plus: 0
              });
              if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 10, player.y - 6, `+${template.name}`, true, "#22c55e");
            }
          }
          if (Sound && Sound.playLootPickup) Sound.playLootPickup();
        } else {
          if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 10, player.y - 6, "NOT ENOUGH GOLD!", false, "#ef4444");
        }
      }
    } else if (this.shopTab === "FORGE") {
      const slotMap = { "4": "weapon", "5": "armor", "6": "accessory" };
      const slot = slotMap[index];
      if (slot) {
        const item = player.equipment[slot];
        if (item) {
          const res = EquipmentManager.enhanceItem(item, player);
          player.recalculateStats();
          this.forgeFeedback = res;
          if (res.success) {
            if (Sound && Sound.playForgeSuccess) Sound.playForgeSuccess();
            if (fx && fx.spawnHitSparks) fx.spawnHitSparks(player.x + 10, player.y + 10, "#ffd166", 24);
            if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 10, player.y - 12, `+${item.plus} SUCCESS!`, true, "#ffd166");
          } else {
            if (Sound && Sound.playForgeFail) Sound.playForgeFail();
            if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 10, player.y - 12, res.message, false, "#ef4444");
          }
        }
      }
    } else if (this.shopTab === "SELL") {
      if (index === "9") {
        // Quick-sell all monster loot
        let earnedGold = 0;
        for (let i = player.inventory.length - 1; i >= 0; i--) {
          const it = player.inventory[i];
          if (it.id && it.id.startsWith("loot_")) {
            earnedGold += (it.price || 15);
            player.inventory.splice(i, 1);
          }
        }
        if (earnedGold > 0) {
          player.gold += earnedGold;
          if (Sound && Sound.playItemSell) Sound.playItemSell();
          if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 10, player.y - 8, `+${earnedGold}G FROM LOOTS!`, true, "#ffd166");
        }
      } else {
        const sellIdx = parseInt(index) - 4;
        const sellables = (player.inventory || []).filter(i => i.price || i.sellPrice);
        if (sellables[sellIdx]) {
          const item = sellables[sellIdx];
          const val = item.sellPrice || Math.round(item.price * 0.5) || 5;
          const actualIdx = player.inventory.findIndex(i => i.uid === item.uid);
          if (actualIdx !== -1) {
            player.inventory.splice(actualIdx, 1);
            player.gold += val;
            if (Sound && Sound.playItemSell) Sound.playItemSell();
            if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 10, player.y - 6, `+${val}G`, true, "#ffd166");
          }
        }
      }
    }
  }

  drawMercenaryModal(ctx, player, screenWidth, screenHeight) {
    const boxW = screenWidth - 80;
    const boxH = screenHeight - 80;
    const boxX = 40;
    const boxY = 40;

    ctx.fillStyle = "rgba(10, 14, 20, 0.94)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 8.5px monospace";
    ctx.textAlign = "center";
    ctx.fillText("⚔️ BARRACKS MERCENARY GUILD (1 ACTIVE • FREE SWITCH) ⚔️", screenWidth / 2, boxY + 20);

    ctx.fillStyle = "#ffffff";
    ctx.font = "7px monospace";
    ctx.fillText("[1] BERSERKER AXEMAN (Whirlwind AOE Cleave) - [SELECT]", screenWidth / 2, boxY + 45);
    ctx.fillText("[2] ARCANE APPRENTICE (Astral Surge Shockwave) - [SELECT]", screenWidth / 2, boxY + 65);
    ctx.fillText("[3] SHARPSHOOTER SCOUT (3-Way Heavy Volley) - [SELECT]", screenWidth / 2, boxY + 85);
    ctx.fillText("[4] VANGUARD PALADIN (Earthshatter Concussion) - [SELECT]", screenWidth / 2, boxY + 105);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "6.5px monospace";
    ctx.fillText("Press 1-4 to Switch Mercenary • ESC to Close", screenWidth / 2, boxY + 135);
  }

  drawPause(ctx, screenWidth, screenHeight) {
    ctx.fillStyle = "rgba(3, 7, 18, 0.78)";
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    const boxW = 180;
    const boxH = 104;
    const boxX = Math.round(screenWidth / 2 - boxW / 2);
    const boxY = Math.round(screenHeight / 2 - boxH / 2);

    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("⏸️ EXPEDITION PAUSED", screenWidth / 2, boxY + 20);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 7px monospace";
    ctx.fillText("[ ESC / P ]   RESUME EXPEDITION", screenWidth / 2, boxY + 40);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 6.5px monospace";
    ctx.fillText("[ X ]   EXPORT SAVE FILE (.JSON)", screenWidth / 2, boxY + 56);

    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 7px monospace";
    ctx.fillText("[ M ]   RETURN TO MAIN MENU", screenWidth / 2, boxY + 74);

    ctx.fillStyle = "#64748b";
    ctx.font = "6px monospace";
    ctx.fillText("PROGRESS AUTO-SAVED IN AETHELGARD", screenWidth / 2, boxY + 92);
  }

  drawGameOver(ctx, screenWidth, screenHeight) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.fillText("YOU HAVE FALLEN", screenWidth / 2, screenHeight / 2 - 8);

    ctx.fillStyle = "#ffd166";
    ctx.font = "7.5px monospace";
    ctx.fillText("PRESS ENTER TO RESTART", screenWidth / 2, screenHeight / 2 + 12);
  }

  // ========================================================
  // 7. EXPORT SAVE FILE MODAL WITH CUSTOM FILENAME
  // ========================================================
  drawExportSaveModal(ctx, exportFilename, screenWidth, screenHeight) {
    ctx.fillStyle = "rgba(4, 8, 18, 0.85)";
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    const boxW = 260;
    const boxH = 130;
    const boxX = Math.round(screenWidth / 2 - boxW / 2);
    const boxY = Math.round(screenHeight / 2 - boxH / 2);

    ctx.fillStyle = "rgba(15, 23, 42, 0.98)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 8.5px monospace";
    ctx.textAlign = "center";
    ctx.fillText("💾 EXPORT SAVE GAME ARCHIVE (.JSON) 💾", screenWidth / 2, boxY + 18);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "5.5px monospace";
    ctx.fillText("Enter file name for downloaded save file:", screenWidth / 2, boxY + 32);

    // Filename Input Box
    const inpW = 220;
    const inpH = 24;
    const inpX = Math.round(screenWidth / 2 - inpW / 2);
    const inpY = boxY + 44;

    ctx.fillStyle = "#090d16";
    ctx.fillRect(inpX, inpY, inpW, inpH);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(inpX, inpY, inpW, inpH);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 7.5px monospace";
    ctx.fillText(exportFilename + "|", screenWidth / 2, inpY + 15);

    // Action Buttons
    const btnW = 105;
    const btnH = 24;
    const btnAcceptX = boxX + 18;
    const btnCancelX = boxX + 137;
    const btnY = boxY + 88;

    // Accept / Download Button
    ctx.fillStyle = "#15803d";
    ctx.fillRect(btnAcceptX, btnY, btnW, btnH);
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 1;
    ctx.strokeRect(btnAcceptX, btnY, btnW, btnH);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 6.5px monospace";
    ctx.fillText("SAVE FILE [ENTER]", btnAcceptX + btnW / 2, btnY + 15);

    // Cancel Button
    ctx.fillStyle = "#334155";
    ctx.fillRect(btnCancelX, btnY, btnW, btnH);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.strokeRect(btnCancelX, btnY, btnW, btnH);

    ctx.fillStyle = "#ffffff";
    ctx.fillText("CANCEL [ESC]", btnCancelX + btnW / 2, btnY + 15);
  }

  // ========================================================
  // 8. PLAYER INVENTORY & ATTRIBUTES MODAL WITH STAT SPENDING
  // ========================================================
  drawInventoryModal(ctx, player, screenWidth, screenHeight) {
    if (!player) return;

    const boxW = 330;
    const boxH = 186;
    const boxX = Math.round(screenWidth / 2 - boxW / 2);
    const boxY = Math.round(screenHeight / 2 - boxH / 2);

    ctx.fillStyle = "rgba(8, 12, 22, 0.98)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Title Bar
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("🛡️ VANGUARD'S GEAR & INVENTORY POUCH 🛡️", screenWidth / 2, boxY + 14);

    // Close Button [X]
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 9px monospace";
    ctx.fillText("✕", boxX + boxW - 14, boxY + 14);

    // ----------------------------------------------------
    // COLUMN 1: CHARACTER ATTRIBUTES & STAT UPGRADES (Width: 92px)
    // ----------------------------------------------------
    const col1X = boxX + 12;
    const col1Y = boxY + 24;
    const col1W = 92;

    ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
    ctx.fillRect(col1X, col1Y, col1W, 148);
    ctx.strokeStyle = "#334155";
    ctx.strokeRect(col1X, col1Y, col1W, 148);

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 7px monospace";
    ctx.fillText(player.playerName || "VANGUARD", col1X + 6, col1Y + 11);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "6px monospace";
    ctx.fillText(`LV.${player.level} ${player.heroData.name}`, col1X + 6, col1Y + 20);

    ctx.fillStyle = player.statPoints > 0 ? "#4ade80" : "#94a3b8";
    ctx.font = "bold 5.8px monospace";
    ctx.fillText(`⭐ STAT PTS: ${player.statPoints}`, col1X + 6, col1Y + 29);

    const upgradeableStats = [
      { key: "hp", label: "MAX HP", val: player.maxHp, color: "#ef4444" },
      { key: "damage", label: "TOTAL ATK", val: player.totalAtk || 14, color: "#f87171" },
      { key: "defense", label: "DEFENSE", val: player.defense || 0, color: "#38bdf8" },
      { key: "speed", label: "SPEED", val: player.speed, color: "#4ade80" },
      { key: "crit", label: "CRIT RATE", val: `${Math.round((player.totalCrit || 0.05) * 100)}%`, color: "#ffd166" }
    ];

    upgradeableStats.forEach((st, idx) => {
      const sy = col1Y + 38 + idx * 16;
      ctx.fillStyle = "#94a3b8";
      ctx.font = "5.5px monospace";
      ctx.fillText(st.label, col1X + 6, sy + 4);

      ctx.fillStyle = st.color;
      ctx.font = "bold 6px monospace";
      ctx.textAlign = "right";
      const valOffset = player.statPoints > 0 ? col1X + col1W - 20 : col1X + col1W - 6;
      ctx.fillText(String(st.val), valOffset, sy + 4);
      ctx.textAlign = "left";

      if (player.statPoints > 0) {
        // Draw [+] upgrade button
        const btnX = col1X + col1W - 16;
        const btnY = sy - 3;
        ctx.fillStyle = "#15803d";
        ctx.fillRect(btnX, btnY, 12, 10);
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = 1;
        ctx.strokeRect(btnX, btnY, 12, 10);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 6px monospace";
        ctx.textAlign = "center";
        ctx.fillText("+", btnX + 6, btnY + 7.5);
        ctx.textAlign = "left";
      }
    });

    // Gold & Stones
    ctx.fillStyle = "#ffd166";
    ctx.font = "5.5px monospace";
    ctx.fillText(`🪙 ${player.gold}G`, col1X + 6, col1Y + 128);
    ctx.fillStyle = "#c084fc";
    ctx.fillText(`🪨 ${player.upgradeStones || 0} Stones`, col1X + 6, col1Y + 140);

    // ----------------------------------------------------
    // COLUMN 2: EQUIPPED GEAR SLOTS (Width: 100px)
    // ----------------------------------------------------
    const col2X = col1X + col1W + 8;
    const col2Y = col1Y;
    const col2W = 100;

    ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
    ctx.fillRect(col2X, col2Y, col2W, 148);
    ctx.strokeStyle = "#334155";
    ctx.strokeRect(col2X, col2Y, col2W, 148);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 7px monospace";
    ctx.fillText("EQUIPPED GEAR", col2X + 6, col2Y + 12);

    const eqSlots = [
      { slot: "weapon", name: "WEAPON", item: player.equipment.weapon, key: "1" },
      { slot: "armor", name: "ARMOR", item: player.equipment.armor, key: "2" },
      { slot: "accessory", name: "ACCESSORY", item: player.equipment.accessory, key: "3" }
    ];

    eqSlots.forEach((eq, idx) => {
      const ey = col2Y + 20 + idx * 42;
      ctx.fillStyle = "rgba(30, 41, 59, 0.6)";
      ctx.fillRect(col2X + 4, ey, col2W - 8, 38);
      ctx.strokeStyle = eq.item ? "#ffd166" : "#334155";
      ctx.strokeRect(col2X + 4, ey, col2W - 8, 38);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 5.8px monospace";
      ctx.fillText(`[${eq.name}]`, col2X + 8, ey + 9);

      if (eq.item) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 6px monospace";
        ctx.fillText(`${eq.item.icon || "⚔️"} ${eq.item.name.slice(0, 11)}`, col2X + 8, ey + 19);

        ctx.fillStyle = "#ffd166";
        ctx.font = "5.5px monospace";
        ctx.fillText(`+${eq.item.plus || 0} Level`, col2X + 8, ey + 27);

        // Unequip Button
        ctx.fillStyle = "#b91c1c";
        ctx.fillRect(col2X + col2W - 38, ey + 21, 30, 12);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 5px monospace";
        ctx.textAlign = "center";
        ctx.fillText("UNEQUIP", col2X + col2W - 23, ey + 29.5);
        ctx.textAlign = "left";
      } else {
        ctx.fillStyle = "#64748b";
        ctx.font = "5.5px monospace";
        ctx.fillText("Empty Slot", col2X + 8, ey + 22);
      }
    });

    // ----------------------------------------------------
    // COLUMN 3: BACKPACK INVENTORY (Width: 100px)
    // ----------------------------------------------------
    const col3X = col2X + col2W + 8;
    const col3Y = col1Y;
    const col3W = 100;

    ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
    ctx.fillRect(col3X, col3Y, col3W, 148);
    ctx.strokeStyle = "#334155";
    ctx.strokeRect(col3X, col3Y, col3W, 148);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 7px monospace";
    ctx.fillText("BACKPACK POUCH", col3X + 6, col3Y + 12);

    const inv = player.inventory || [];
    if (inv.length === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = "6px monospace";
      ctx.fillText("Pouch is empty.", col3X + 8, col3Y + 32);
    } else {
      const showCount = Math.min(6, inv.length);
      for (let i = 0; i < showCount; i++) {
        const item = inv[i];
        const iy = col3Y + 18 + i * 21;

        ctx.fillStyle = "rgba(30, 41, 59, 0.6)";
        ctx.fillRect(col3X + 4, iy, col3W - 8, 18);
        ctx.strokeStyle = "#334155";
        ctx.strokeRect(col3X + 4, iy, col3W - 8, 18);

        ctx.fillStyle = "#ffffff";
        ctx.font = "5.5px monospace";
        ctx.fillText(`${item.icon || "📦"} ${item.name.slice(0, 10)}`, col3X + 7, iy + 8);

        // Action Button: USE or EQUIP
        const isConsumable = item.type === "consumable";
        const isEquip = item.type === "weapon" || item.type === "armor" || item.type === "accessory";

        if (isConsumable || isEquip) {
          ctx.fillStyle = isConsumable ? "#15803d" : "#0284c7";
          ctx.fillRect(col3X + col3W - 32, iy + 3, 24, 12);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 5px monospace";
          ctx.textAlign = "center";
          ctx.fillText(isConsumable ? "USE" : "EQUIP", col3X + col3W - 20, iy + 11.5);
          ctx.textAlign = "left";
        }
      }
    }
  }

  // ========================================================
  // 9. LORE & ADVENTURE CHRONICLES MODAL ([L] / [LORE] BUTTON)
  // ========================================================
  drawLoreModal(ctx, player, screenWidth, screenHeight) {
    const boxW = 340;
    const boxH = 194;
    const boxX = Math.round(screenWidth / 2 - boxW / 2);
    const boxY = Math.round(screenHeight / 2 - boxH / 2);

    ctx.fillStyle = "rgba(8, 12, 22, 0.98)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Title Bar
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("📖 ARCHIVES OF AETHELGARD & HERO LORE 📖", screenWidth / 2, boxY + 14);

    // Navigation Tabs: [1] HEROES LORE vs [2] 12 ARCS WORLD STORY
    const t1X = boxX + 45;
    const t2X = boxX + 175;
    const tabW = 115;

    ctx.fillStyle = this.loreTab === "HEROES" ? "#ffd166" : "#1e293b";
    ctx.fillRect(t1X, boxY + 20, tabW, 13);
    ctx.fillStyle = this.loreTab === "HEROES" ? "#0f172a" : "#94a3b8";
    ctx.font = "bold 6.5px monospace";
    ctx.fillText("[1] EARTHBOUND HEROES", t1X + tabW / 2, boxY + 29);

    ctx.fillStyle = this.loreTab === "ARCS" ? "#ffd166" : "#1e293b";
    ctx.fillRect(t2X, boxY + 20, tabW, 13);
    ctx.fillStyle = this.loreTab === "ARCS" ? "#0f172a" : "#94a3b8";
    ctx.font = "bold 6.5px monospace";
    ctx.fillText("[2] 12 ARCS OF DESTINY", t2X + tabW / 2, boxY + 29);

    // Close Button [X]
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 9px monospace";
    ctx.fillText("✕", boxX + boxW - 14, boxY + 14);

    if (this.loreTab === "HEROES") {
      const heroKeys = ["knight", "mage", "priest", "archer", "fighter"];
      const heroKey = heroKeys[this.loreHeroIdx % heroKeys.length];
      const lore = ISEKAI_LORE[heroKey];

      // Hero selection buttons
      for (let i = 0; i < heroKeys.length; i++) {
        const hKey = heroKeys[i];
        const hx = boxX + 16 + i * 62;
        const hy = boxY + 38;
        const isSel = i === this.loreHeroIdx;

        ctx.fillStyle = isSel ? "#ffd166" : "#1e293b";
        ctx.fillRect(hx, hy, 56, 12);
        ctx.strokeStyle = isSel ? "#ffd166" : "#334155";
        ctx.strokeRect(hx, hy, 56, 12);

        ctx.fillStyle = isSel ? "#0f172a" : "#94a3b8";
        ctx.font = "bold 5.5px monospace";
        ctx.textAlign = "center";
        ctx.fillText(hKey.toUpperCase(), hx + 28, hy + 8.5);
      }

      // Hero Details Card
      const cardX = boxX + 16;
      const cardY = boxY + 54;
      const cardW = boxW - 32;
      const cardH = 118;

      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.strokeStyle = "#38bdf8";
      ctx.strokeRect(cardX, cardY, cardW, cardH);

      ctx.textAlign = "left";
      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 7.5px monospace";
      ctx.fillText(`${lore.realName.toUpperCase()} — ${heroKey.toUpperCase()}`, cardX + 10, cardY + 13);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "6px monospace";
      ctx.fillText(`ORIGIN: ${lore.origin} | ROLE: ${lore.earthRole}`, cardX + 10, cardY + 24);

      ctx.fillStyle = "#f87171";
      ctx.font = "5.8px monospace";
      ctx.fillText(`SUMMON EVENT: ${lore.summonEvent}`, cardX + 10, cardY + 36);

      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 6px monospace";
      ctx.fillText(`INHERITED TRAIT: ${lore.trait}`, cardX + 10, cardY + 48);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "5.5px monospace";
      const descLines = this.wrapText(ctx, lore.loreDesc, cardW - 20);
      descLines.forEach((l, idx) => {
        ctx.fillText(l, cardX + 10, cardY + 62 + idx * 11);
      });

      ctx.fillStyle = "#94a3b8";
      ctx.font = "5.5px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Click Hero Tabs or [1-5] to Inspect Heroes | [L / ESC] Close", screenWidth / 2, boxY + boxH - 6);
    } else {
      // 12 Arcs Lore View
      const arc = QUEST_ARCS[this.loreArcIdx % QUEST_ARCS.length];

      // Arc Navigation (< Prev | Next >)
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 6.5px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`[◀ PREV]`, boxX + 16, boxY + 44);
      ctx.textAlign = "right";
      ctx.fillText(`[NEXT ▶]`, boxX + boxW - 16, boxY + 44);

      ctx.textAlign = "center";
      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 7px monospace";
      ctx.fillText(`ARC ${arc.id} OF 12 (${arc.levelRange})`, screenWidth / 2, boxY + 44);

      // Arc Content Card
      const cardX = boxX + 16;
      const cardY = boxY + 52;
      const cardW = boxW - 32;
      const cardH = 122;

      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.strokeStyle = "#ffd166";
      ctx.strokeRect(cardX, cardY, cardW, cardH);

      ctx.textAlign = "left";
      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 7.5px monospace";
      ctx.fillText(arc.title, cardX + 10, cardY + 13);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "6px monospace";
      ctx.fillText(`SUGGESTED COMBAT LEVEL: ${arc.levelRange}`, cardX + 10, cardY + 24);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "5.8px monospace";
      const descLines = this.wrapText(ctx, arc.desc, cardW - 20);
      descLines.forEach((l, idx) => {
        ctx.fillText(l, cardX + 10, cardY + 36 + idx * 11);
      });

      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 6px monospace";
      ctx.fillText("CHAPTER CHAPTERS & MISSIONS (5 QUESTS PER ARC):", cardX + 10, cardY + 68);

      arc.quests.forEach((q, idx) => {
        ctx.fillStyle = "#ffffff";
        ctx.font = "5.5px monospace";
        ctx.fillText(`• ${q.title} (${q.type}): ${q.desc.slice(0, 38)}`, cardX + 10, cardY + 80 + idx * 8.5);
      });

      ctx.fillStyle = "#94a3b8";
      ctx.font = "5.5px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Click [PREV] / [NEXT] or Mouse Wheel to browse Arcs | [ESC] Close", screenWidth / 2, boxY + boxH - 5);
    }
  }

  wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + (currentLine ? " " : "") + words[i];
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = words[i];
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // ========================================================
  // 10. MOUSE CLICK HIT-TESTING FOR ALL MODALS
  // ========================================================
  handleShopModalClick(clickX, clickY, player, fx, screenWidth, screenHeight) {
    const boxW = 320;
    const boxH = 175;
    const boxX = Math.round(screenWidth / 2 - boxW / 2);
    const boxY = Math.round(screenHeight / 2 - boxH / 2);

    // Close button [X] at top right
    if (clickX >= boxX + boxW - 24 && clickX <= boxX + boxW - 6 && clickY >= boxY + 6 && clickY <= boxY + 22) {
      return { close: true };
    }

    // Tabs: BUY (tab 0), FORGE (tab 1), SELL (tab 2)
    const tabW = 80;
    const tabStartX = boxX + 35;
    for (let i = 0; i < 3; i++) {
      const tx = tabStartX + i * (tabW + 10);
      if (clickX >= tx && clickX <= tx + tabW && clickY >= boxY + 22 && clickY <= boxY + 36) {
        if (i === 0) this.shopTab = "BUY";
        else if (i === 1) this.shopTab = "FORGE";
        else if (i === 2) this.shopTab = "SELL";
        if (Sound && Sound.playSelectMove) Sound.playSelectMove();
        return { handled: true };
      }
    }

    // Content rows clicking
    if (this.shopTab === "BUY") {
      for (let idx = 0; idx < 5; idx++) {
        const iy = boxY + 46 + idx * 19;
        if (clickX >= boxX + 16 && clickX <= boxX + boxW - 16 && clickY >= iy - 4 && clickY <= iy + 16) {
          const hotkeys = ["4", "5", "6", "7", "8"];
          this.buyShopItem(hotkeys[idx], player, fx);
          return { handled: true };
        }
      }
    } else if (this.shopTab === "FORGE") {
      for (let idx = 0; idx < 3; idx++) {
        const sy = boxY + 44 + idx * 24;
        if (clickX >= boxX + 16 && clickX <= boxX + boxW - 16 && clickY >= sy && clickY <= sy + 22) {
          const hotkeys = ["4", "5", "6"];
          this.buyShopItem(hotkeys[idx], player, fx);
          return { handled: true };
        }
      }
    } else if (this.shopTab === "SELL") {
      if (clickX >= boxX + 40 && clickX <= boxX + boxW - 40 && clickY >= boxY + 116 && clickY <= boxY + 136) {
        this.buyShopItem("9", player, fx);
        return { handled: true };
      }

      const sellables = (player.inventory || []).filter(i => i.price || i.sellPrice);
      const maxShown = Math.min(4, sellables.length);
      for (let idx = 0; idx < maxShown; idx++) {
        const sy = boxY + 44 + idx * 18;
        if (clickX >= boxX + 16 && clickX <= boxX + boxW - 16 && clickY >= sy && clickY <= sy + 18) {
          this.buyShopItem(String(4 + idx), player, fx);
          return { handled: true };
        }
      }
    }

    return { handled: false };
  }

  handleMercenaryModalClick(clickX, clickY, player, fx, mercManager, screenWidth, screenHeight) {
    const boxW = screenWidth - 80;
    const boxH = screenHeight - 80;
    const boxX = 40;
    const boxY = 40;

    if (clickX >= boxX + boxW - 24 && clickX <= boxX + boxW - 6 && clickY >= boxY + 6 && clickY <= boxY + 22) {
      return { close: true };
    }

    const mercTypes = ["axe", "wand", "crossbow", "greatsword"];
    for (let i = 0; i < 4; i++) {
      const my = boxY + 38 + i * 20;
      if (clickX >= boxX + 20 && clickX <= boxX + boxW - 20 && clickY >= my - 2 && clickY <= my + 18) {
        mercManager.hire(mercTypes[i], player, fx);
        return { close: true };
      }
    }

    return { handled: false };
  }

  handleInventoryModalClick(clickX, clickY, player, fx, screenWidth, screenHeight) {
    if (!player) return { close: true };

    const boxW = 330;
    const boxH = 186;
    const boxX = Math.round(screenWidth / 2 - boxW / 2);
    const boxY = Math.round(screenHeight / 2 - boxH / 2);

    // Close Button [X] or Click Outside
    if (clickX >= boxX + boxW - 24 && clickX <= boxX + boxW - 6 && clickY >= boxY + 6 && clickY <= boxY + 22) {
      return { close: true };
    }

    const col1X = boxX + 12;
    const col1Y = boxY + 24;
    const col1W = 92;
    const col2X = col1X + col1W + 8;
    const col2Y = boxY + 24;
    const col2W = 100;
    const col3X = col2X + col2W + 8;
    const col3Y = boxY + 24;
    const col3W = 100;

    // Check [+] stat upgrades in Column 1
    if (player.statPoints > 0) {
      const upgradeableKeys = ["hp", "damage", "defense", "speed", "crit"];
      for (let i = 0; i < upgradeableKeys.length; i++) {
        const sy = col1Y + 38 + i * 16;
        const btnX = col1X + col1W - 16;
        const btnY = sy - 3;
        if (clickX >= btnX && clickX <= btnX + 12 && clickY >= btnY && clickY <= btnY + 10) {
          player.upgradeStat(upgradeableKeys[i]);
          if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
          if (fx && fx.spawnDamagePopup) {
            fx.spawnDamagePopup(player.x + 10, player.y - 10, `+${upgradeableKeys[i].toUpperCase()}!`, true, "#4ade80");
          }
          return { handled: true };
        }
      }
    }

    // Check Unequip clicks in Column 2
    const eqSlots = ["weapon", "armor", "accessory"];
    for (let i = 0; i < 3; i++) {
      const ey = col2Y + 20 + i * 42;
      const unequipBtn = { x: col2X + col2W - 38, y: ey + 21, w: 30, h: 12 };
      if (clickX >= unequipBtn.x && clickX <= unequipBtn.x + unequipBtn.w &&
          clickY >= unequipBtn.y && clickY <= unequipBtn.y + unequipBtn.h) {
        player.unequipItem(eqSlots[i]);
        if (Sound && Sound.playSelectMove) Sound.playSelectMove();
        return { handled: true };
      }
    }

    // Check Use / Equip clicks in Column 3
    const inv = player.inventory || [];
    const showCount = Math.min(6, inv.length);
    for (let i = 0; i < showCount; i++) {
      const item = inv[i];
      const iy = col3Y + 18 + i * 21;
      const actBtn = { x: col3X + col3W - 32, y: iy + 3, w: 24, h: 12 };

      if (clickX >= actBtn.x && clickX <= actBtn.x + actBtn.w &&
          clickY >= actBtn.y && clickY <= actBtn.y + actBtn.h) {
        if (item.type === "consumable") {
          player.useConsumable(item.uid, fx);
        } else if (item.type === "weapon" || item.type === "armor" || item.type === "accessory") {
          player.equipItem(item);
        }
        return { handled: true };
      }
    }

    return { handled: false };
  }

  handleQuestLogModalClick(clickX, clickY, questManager, player, fx, screenWidth, screenHeight) {
    const boxW = 330;
    const boxH = 186;
    const boxX = Math.round(screenWidth / 2 - boxW / 2);
    const boxY = Math.round(screenHeight / 2 - boxH / 2);

    // Close button
    if (clickX >= boxX + boxW - 24 && clickX <= boxX + boxW - 6 && clickY >= boxY + 6 && clickY <= boxY + 22) {
      return { close: true };
    }

    // Tab 1 (Quests)
    const t1X = boxX + 50;
    const t2X = boxX + 170;
    if (clickX >= t1X && clickX <= t1X + 100 && clickY >= boxY + 20 && clickY <= boxY + 33) {
      if (questManager) questManager.tab = "QUESTS";
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      return { handled: true };
    }
    // Tab 2 (Achievements)
    if (clickX >= t2X && clickX <= t2X + 110 && clickY >= boxY + 20 && clickY <= boxY + 33) {
      if (questManager) questManager.tab = "ACHIEVEMENTS";
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      return { handled: true };
    }

    // Handle clicking on Arc rows in Achievements tab to Embark / Unlock
    if (questManager && questManager.tab === "ACHIEVEMENTS") {
      const maxUnl = questManager.maxUnlockedArcIndex || questManager.currentArcIndex || 0;
      for (let i = 0; i < 6; i++) {
        const aY = boxY + 54 + i * 19;
        if (clickX >= boxX + 16 && clickX <= boxX + boxW - 16 && clickY >= aY && clickY <= aY + 16) {
          if (i <= maxUnl) {
            questManager.currentArcIndex = i;
            questManager.tab = "QUESTS";
            if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
            if (fx && fx.spawnDamagePopup) {
              fx.spawnDamagePopup(player.x + 10, player.y - 12, "EMBARKED ON ARC " + (i + 1) + "!", true, "#38bdf8");
            }
            return { handled: true };
          }
        }
      }
    }

    // Claim reward button (Bottom Area)
    if (clickX >= boxX + 30 && clickX <= boxX + boxW - 30 && clickY >= boxY + boxH - 24 && clickY <= boxY + boxH - 4) {
      const q = questManager ? questManager.getCurrentQuest() : null;
      if (q && q.progress >= q.maxProgress) {
        questManager.completeCurrentQuest(player, fx);
      }
      return { handled: true };
    }

    return { handled: false };
  }

  handleLoreModalClick(clickX, clickY, screenWidth, screenHeight) {
    const boxW = 340;
    const boxH = 194;
    const boxX = Math.round(screenWidth / 2 - boxW / 2);
    const boxY = Math.round(screenHeight / 2 - boxH / 2);

    // Close Button [X]
    if (clickX >= boxX + boxW - 24 && clickX <= boxX + boxW - 6 && clickY >= boxY + 6 && clickY <= boxY + 22) {
      return { close: true };
    }

    // Tab 1: HEROES vs Tab 2: ARCS
    const t1X = boxX + 45;
    const t2X = boxX + 175;
    const tabW = 115;
    if (clickX >= t1X && clickX <= t1X + tabW && clickY >= boxY + 20 && clickY <= boxY + 33) {
      this.loreTab = "HEROES";
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      return { handled: true };
    }
    if (clickX >= t2X && clickX <= t2X + tabW && clickY >= boxY + 20 && clickY <= boxY + 33) {
      this.loreTab = "ARCS";
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      return { handled: true };
    }

    if (this.loreTab === "HEROES") {
      const heroKeys = ["knight", "mage", "priest", "archer", "fighter"];
      for (let i = 0; i < heroKeys.length; i++) {
        const hx = boxX + 16 + i * 62;
        const hy = boxY + 38;
        if (clickX >= hx && clickX <= hx + 56 && clickY >= hy && clickY <= hy + 14) {
          this.loreHeroIdx = i;
          if (Sound && Sound.playSelectHover) Sound.playSelectHover();
          return { handled: true };
        }
      }
    } else if (this.loreTab === "ARCS") {
      // Prev button
      if (clickX >= boxX + 16 && clickX <= boxX + 80 && clickY >= boxY + 38 && clickY <= boxY + 50) {
        this.loreArcIdx = (this.loreArcIdx - 1 + QUEST_ARCS.length) % QUEST_ARCS.length;
        if (Sound && Sound.playSelectMove) Sound.playSelectMove();
        return { handled: true };
      }
      // Next button
      if (clickX >= boxX + boxW - 80 && clickX <= boxX + boxW - 16 && clickY >= boxY + 38 && clickY <= boxY + 50) {
        this.loreArcIdx = (this.loreArcIdx + 1) % QUEST_ARCS.length;
        if (Sound && Sound.playSelectMove) Sound.playSelectMove();
        return { handled: true };
      }
    }

    return { handled: false };
  }

  handleExportSaveModalClick(clickX, clickY, screenWidth, screenHeight) {
    const boxW = 260;
    const boxH = 130;
    const boxX = Math.round(screenWidth / 2 - boxW / 2);
    const boxY = Math.round(screenHeight / 2 - boxH / 2);

    const btnW = 105;
    const btnH = 24;
    const btnAcceptX = boxX + 18;
    const btnCancelX = boxX + 137;
    const btnY = boxY + 88;

    if (clickX >= btnAcceptX && clickX <= btnAcceptX + btnW && clickY >= btnY && clickY <= btnY + btnH) {
      return "SAVE";
    }
    if (clickX >= btnCancelX && clickX <= btnCancelX + btnW && clickY >= btnY && clickY <= btnY + btnH) {
      return "CANCEL";
    }
    return null;
  }


  // ========================================================
  // 11. ROYAL CASTLE GUARD GARRISON & BOUNTY MODAL
  // ========================================================
  drawGuardModal(ctx, player, questManager, screenWidth, screenHeight) {
    const boxW = 320;
    const boxH = 175;
    const boxX = Math.round(screenWidth / 2 - boxW / 2);
    const boxY = Math.round(screenHeight / 2 - boxH / 2);

    ctx.fillStyle = "rgba(8, 12, 22, 0.98)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Title Bar
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 8.5px monospace";
    ctx.textAlign = "center";
    ctx.fillText("👑 ROYAL CITADEL GARRISON — CAPTAIN VALERIE 👑", screenWidth / 2, boxY + 14);

    // Close Button [X]
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 9px monospace";
    ctx.fillText("✕", boxX + boxW - 14, boxY + 14);

    const arcIdx = questManager ? questManager.currentArcIndex : 0;
    const curArc = QUEST_ARCS[arcIdx] || QUEST_ARCS[0];

    ctx.textAlign = "left";
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 6.8px monospace";
    ctx.fillText(`CITADEL DEFENSE DIRECTIVE (CURRENT ARC: ${curArc.title})`, boxX + 16, boxY + 32);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "5.8px monospace";
    ctx.fillText("I oversee the realm's defense. Complete Vanguard duties across the Arcs", boxX + 16, boxY + 44);
    ctx.fillText("to earn Royal Honors, Gold Bounties, and Master Enhancement Stones!", boxX + 16, boxY + 54);

    // Castle Guard Arc Duties (Arcs 3, 6, 9, 12)
    const guardDuties = [
      { arcId: 3, title: "Arc III: Crypt Purge", reward: "+1000G • 8 Stones", desc: "Cleanse undead risen at eastern burial grounds." },
      { arcId: 6, title: "Arc VI: Wyrm Defense", reward: "+3000G • 12 Stones", desc: "Slay magma dragons threatening the ramparts." },
      { arcId: 9, title: "Arc IX: Abyss Garrison", reward: "+6000G • 16 Stones", desc: "Hold the fortress gates against infernal fiends." },
      { arcId: 12, title: "Arc XII: Royal Stand", reward: "+15000G • 25 Stones", desc: "Defend the citadel against the Void Convergence." }
    ];

    guardDuties.forEach((d, idx) => {
      const dy = boxY + 66 + idx * 22;
      const isAvailable = arcIdx + 1 >= d.arcId;
      const isCurrent = (arcIdx + 1 === d.arcId);

      ctx.fillStyle = isCurrent ? "rgba(255, 209, 102, 0.15)" : (isAvailable ? "rgba(34, 197, 94, 0.1)" : "rgba(30, 41, 59, 0.4)");
      ctx.fillRect(boxX + 16, dy, boxW - 32, 19);
      ctx.strokeStyle = isCurrent ? "#ffd166" : (isAvailable ? "#22c55e" : "#334155");
      ctx.lineWidth = isCurrent ? 1.2 : 1;
      ctx.strokeRect(boxX + 16, dy, boxW - 32, 19);

      ctx.fillStyle = isCurrent ? "#ffd166" : (isAvailable ? "#4ade80" : "#64748b");
      ctx.font = "bold 6px monospace";
      ctx.fillText(d.title, boxX + 22, dy + 8);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "5px monospace";
      ctx.fillText(d.desc, boxX + 22, dy + 15);

      ctx.fillStyle = isAvailable ? "#ffd166" : "#64748b";
      ctx.textAlign = "right";
      ctx.fillText(d.reward, boxX + boxW - 22, dy + 10);
      ctx.textAlign = "left";
    });

    ctx.fillStyle = "#94a3b8";
    ctx.font = "5.5px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Advance through the 12 Arcs to unlock all Royal Citadel Bounties | [ESC] Close", screenWidth / 2, boxY + boxH - 6);
  }

  handleGuardModalClick(clickX, clickY, screenWidth, screenHeight) {
    const boxW = 320;
    const boxH = 175;
    const boxX = Math.round(screenWidth / 2 - boxW / 2);
    const boxY = Math.round(screenHeight / 2 - boxH / 2);

    if (clickX >= boxX + boxW - 24 && clickX <= boxX + boxW - 6 && clickY >= boxY + 6 && clickY <= boxY + 22) {
      return { close: true };
    }
    return { handled: false };
  }

  handlePauseModalClick(clickX, clickY, screenWidth, screenHeight) {
    const boxW = 180;
    const boxH = 104;
    const boxX = Math.round(screenWidth / 2 - boxW / 2);
    const boxY = Math.round(screenHeight / 2 - boxH / 2);

    if (clickX >= boxX + 16 && clickX <= boxX + boxW - 16 && clickY >= boxY + 32 && clickY <= boxY + 48) {
      return "RESUME";
    }
    if (clickX >= boxX + 16 && clickX <= boxX + boxW - 16 && clickY >= boxY + 49 && clickY <= boxY + 65) {
      return "EXPORT";
    }
    if (clickX >= boxX + 16 && clickX <= boxX + boxW - 16 && clickY >= boxY + 66 && clickY <= boxY + 84) {
      return "TITLE";
    }

    return null;
  }
}