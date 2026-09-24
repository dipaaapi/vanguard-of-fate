import { Sound } from "./audio.js";

export class LootManager {
    constructor() {
        this.items = [];
    }

    spawnDrop(x, y) {
        const rand = Math.random();
        let dropType = null;
        let color = "#ffffff";

        if (rand < 0.40) {
            dropType = "herb";
            color = "#52b788";
        } else if (rand < 0.85) {
            const shardTypes = [
                { type: "shard_damage", color: "#ff3333" },
                { type: "shard_atkspd", color: "#ffd166" },
                { type: "shard_speed", color: "#00f0ff" },
                { type: "shard_invis", color: "#9d4edd" }
            ];
            const picked = shardTypes[Math.floor(Math.random() * shardTypes.length)];
            dropType = picked.type;
            color = picked.color;
        } else {
            return;
        }

        this.items.push({
            x: x + (Math.random() * 8 - 4),
            y: y + (Math.random() * 8 - 4),
            type: dropType,
            color: color,
            bobTimer: Math.random() * Math.PI * 2,
            isAttracted: false
        });
    }

    update(player, fx) {
        if (!player || player.hp <= 0) return;

        const pCenterX = player.x + 12;
        const pCenterY = player.y + 12;
        const pickupMagnetRadius = 60;
        const collectRadius = 10;

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.bobTimer += 0.08;

            const dx = pCenterX - item.x;
            const dy = pCenterY - item.y;
            const dist = Math.hypot(dx, dy);

            if (dist < pickupMagnetRadius) {
                item.isAttracted = true;
                const pullSpeed = Math.min(6.5, 2.5 + (1 - dist / pickupMagnetRadius) * 5.0);
                item.x += (dx / dist) * pullSpeed;
                item.y += (dy / dist) * pullSpeed;
            }

            // LOOT PICKED UP: Sipsipin at patunugin!
            if (dist < collectRadius) {
                Sound.playLootPickup(); // SFX: Malutong na Pickup Chime
                this.applyBuff(player, item, fx);
                fx.spawnHitSparks(item.x, item.y, item.color, 10);
                this.items.splice(i, 1);
            }
        }
    }

    applyBuff(player, item, fx) {
        const pX = player.x + 12;
        const pY = player.y - 6;

        if (item.type === "herb") {
            player.hp = Math.min(player.maxHp, player.hp + 30);
            player.skillCooldownTimer = 0;
            fx.spawnDamagePopup(pX, pY, "+30 HP & CD RESET!", true);
        } else if (item.type === "shard_damage") {
            player.buffs.damage = 420;
            fx.spawnDamagePopup(pX, pY, "DAMAGE UP!", true);
        } else if (item.type === "shard_atkspd") {
            player.buffs.atkSpeed = 420;
            fx.spawnDamagePopup(pX, pY, "RAPID ATTACK!", true);
        } else if (item.type === "shard_speed") {
            player.buffs.moveSpeed = 420;
            fx.spawnDamagePopup(pX, pY, "SPEED UP!", true);
        } else if (item.type === "shard_invis") {
            player.buffs.invis = 360;
            fx.spawnDamagePopup(pX, pY, "GHOST STEALTH!", true);
        }
    }

    draw(ctx) {
        this.items.forEach(item => {
            const hoverY = item.y + Math.sin(item.bobTimer) * 3;

            ctx.fillStyle = "rgba(10, 14, 20, 0.35)";
            ctx.beginPath();
            ctx.ellipse(item.x, item.y + 6, 4, 1.5, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = item.color;
            ctx.globalAlpha = 0.25;
            ctx.beginPath();
            ctx.arc(item.x, hoverY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            if (item.type === "herb") {
                ctx.fillStyle = "#2d6a4f";
                ctx.fillRect(item.x - 2, hoverY - 3, 4, 5);
                ctx.fillStyle = "#52b788";
                ctx.fillRect(item.x - 1, hoverY - 4, 3, 5);
                ctx.fillStyle = "#74c69d";
                ctx.fillRect(item.x, hoverY - 2, 1, 2);
            } else {
                ctx.fillStyle = item.color;
                ctx.fillRect(item.x - 1, hoverY - 4, 2, 6);
                ctx.fillRect(item.x - 3, hoverY - 2, 6, 3);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(item.x - 1, hoverY - 1, 2, 2);
            }
        });
    }

    clear() {
        this.items = [];
    }
}