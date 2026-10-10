import { TILE, drawTree, drawRock } from "./tileset.js";
import { SUN, SHADOW_COLOR, viewOf, pixelEllipse } from "./layers.js";

// ==================== PROPS (layers 2 and 3) ====================
// The solid things that grow on the ground: ancient trees, mossy stones and shoreline boulders.
// - Each is drawn whole from a cached sprite, sorted by the Y of its base with the characters:
//   behind a hero who stands in front of it, over one who walks behind it (layer 3).
// - Only its roots block: the collision box is the lower third of the sprite, so heroes,
//   summons and projectiles pass behind the canopy and the top of a stone (TileMap.resolveCollision).
// - Its contact shadow is a pixel ellipse cast toward the lower right along the sun (layer 2).
// The coarse tile grid (tm.solid) still marks the whole base row, so monster pathing and spawns
// stay as cautious as before.

const CELL = 32;          // atlas cell
const ATLAS_COLS = 32;
// Sprite box, base (feet line), root box (lower third, narrowed to the trunk) and shadow, per kind
const KINDS = {
  tree:    { w: 32, h: 32, oy: -TILE, base: 29, root: { x: 9, y: 21, w: 14, h: 10 }, shadow: { rx: 11, ry: 3.5, off: 3 } },
  rock:    { w: 16, h: 16, oy: 0, base: 13, root: { x: 3, y: 10, w: 10, h: 5 }, shadow: { rx: 6, ry: 2, off: 1.5 } },
  boulder: { w: 16, h: 16, oy: 0, base: 14, root: { x: 2, y: 10, w: 12, h: 5 }, shadow: { rx: 7, ry: 2.5, off: 2 } }
};
const shadowSprites = new Map();
function shadowOf(kind) {
  if (!shadowSprites.has(kind)) {
    const s = KINDS[kind].shadow;
    shadowSprites.set(kind, pixelEllipse(s.rx, s.ry, SHADOW_COLOR));
  }
  return shadowSprites.get(kind);
}

export class PropField {
  constructor(tm, theme) {
    this.tm = tm;
    this.props = [];
    tm.objects.forEach((o) => {
      const k = KINDS[o.type];
      if (!k) return;   // bushes stay on the ground canvas: they are low and nobody hides behind them
      const x = o.tx * TILE, y = o.ty * TILE + k.oy;
      this.props.push({
        o, kind: o.type, k, x, y, w: k.w, h: k.h, base: y + k.base, cx: x + k.w / 2,
        root: { x: x + k.root.x, y: y + k.root.y, w: k.root.w, h: k.root.h }
      });
    });
    this.props.sort((a, b) => a.base - b.base || a.x - b.x);
    this.props.forEach((p, i) => { p.cell = i; });

    // Root boxes by tile: a solid tile that only holds roots collides with the roots, not the whole tile
    this.byTile = new Map();
    this.props.forEach((p) => {
      const r = p.root;
      for (let ty = Math.floor(r.y / TILE); ty <= Math.floor((r.y + r.h - 1) / TILE); ty++) {
        for (let tx = Math.floor(r.x / TILE); tx <= Math.floor((r.x + r.w - 1) / TILE); tx++) {
          if (!tm.inBounds(tx, ty)) continue;
          const i = tm.idx(tx, ty);
          if (!this.byTile.has(i)) this.byTile.set(i, []);
          this.byTile.get(i).push(r);
        }
      }
    });
    // Tiles that are solid only because a prop stands on them (the rest of the tile is open ground)
    tm.objects.forEach((o) => {
      const k = KINDS[o.type];
      if (!k) return;
      const tiles = o.type === "tree" ? [[o.tx, o.ty], [o.tx + 1, o.ty]] : [[o.tx, o.ty]];
      tiles.forEach(([tx, ty]) => {
        if (!tm.inBounds(tx, ty)) return;
        const i = tm.idx(tx, ty);
        if (!this.byTile.has(i)) this.byTile.set(i, []);
      });
    });
    this.bake(theme);
  }

  // One atlas with every prop's sprite (no shadow: layer 2 draws it)
  bake(theme) {
    const n = this.props.length;
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.min(n, ATLAS_COLS) * CELL);
    c.height = Math.max(1, Math.ceil(n / ATLAS_COLS) * CELL);
    const g = c.getContext("2d");
    this.atlas = c;
    if (!g) return;
    g.imageSmoothingEnabled = false;
    this.props.forEach((p) => {
      const ax = (p.cell % ATLAS_COLS) * CELL, ay = Math.floor(p.cell / ATLAS_COLS) * CELL;
      if (p.kind === "tree") drawTree(g, ax, ay, p.o.seed, theme.tree, false);
      else drawRock(g, ax, ay, p.o.seed, theme.rock, false);
      if (p.kind === "boulder") {
        // a shoreline boulder: wet sheen at its foot and a cap of moss or salt
        g.fillStyle = "rgba(224, 247, 250, 0.45)";
        g.fillRect(ax + 4, ay + 12, 8, 1);
        g.fillStyle = theme.grassLight;
        g.fillRect(ax + 6, ay + 4, 4, 1);
        g.fillRect(ax + 5, ay + 5, 2, 1);
      } else if (p.kind === "rock" && (p.o.seed & 3) === 0) {
        g.fillStyle = theme.grassLight;   // moss
        g.fillRect(ax + 6, ay + 4, 3, 1);
      }
    });
  }

  // Free the atlas (a platform's teardown)
  destroy() {
    if (this.atlas) { this.atlas.width = this.atlas.height = 0; this.atlas = null; }
  }

  // Props whose sprite or shadow is on screen
  visible(view) {
    const out = [];
    const y0 = view.y - 8, y1 = view.y + view.h + CELL + 8;
    for (const p of this.props) {
      if (p.base < y0) continue;
      if (p.base - CELL > y1) break;     // sorted by base: nothing further down is on screen
      if (p.x + p.w + 8 < view.x || p.x > view.x + view.w) continue;
      out.push(p);
    }
    return out;
  }

  sprite(ctx, p) {
    if (!this.atlas) return;
    const ax = (p.cell % ATLAS_COLS) * CELL, ay = Math.floor(p.cell / ATLAS_COLS) * CELL;
    ctx.drawImage(this.atlas, ax, ay, p.w, p.h, p.x, p.y, p.w, p.h);
  }

  // ---------- LAYER 2: contact shadows along the sun vector ----------
  drawShadows(ctx) {
    this.onScreen = this.visible(viewOf(ctx));
    for (const p of this.onScreen) {
      const s = p.k.shadow, img = shadowOf(p.kind);
      const sx = Math.round(p.cx + SUN.dx * s.off - img.width / 2);
      const sy = Math.round(p.base + SUN.dy * s.off - img.height / 2);
      ctx.drawImage(img, sx, sy);
    }
  }

  // ---------- LAYER 3 (back): every prop on screen, before the characters ----------
  drawBack(ctx) {
    if (!this.onScreen) this.onScreen = this.visible(viewOf(ctx));
    for (const p of this.onScreen) this.sprite(ctx, p);
  }

  // ---------- LAYER 3 (front): props again over the characters standing behind them ----------
  // feet: [{ x, y, r }] the foot point of every character on screen (r: half its sprite width)
  drawFront(ctx, feet) {
    const list = this.onScreen || [];
    this.onScreen = null;
    if (!feet.length) return;
    for (const p of list) {
      for (const f of feet) {
        // behind the prop (feet above its base) and the body reaches into its sprite
        if (f.y >= p.base || f.y < p.y - 2 || Math.abs(f.x - p.cx) > p.w / 2 + f.r) continue;
        this.sprite(ctx, p);
        break;
      }
    }
  }

  // Map snapshots (minimap, world map): every prop with its shadow
  paintAll(ctx) {
    for (const p of this.props) {
      const s = p.k.shadow, img = shadowOf(p.kind);
      ctx.drawImage(img, Math.round(p.cx + SUN.dx * s.off - img.width / 2), Math.round(p.base + SUN.dy * s.off - img.height / 2));
      this.sprite(ctx, p);
    }
  }

  // Root boxes standing on a tile, or null when the tile is not a prop's
  rootsAt(i) {
    return this.byTile.get(i) || null;
  }

  // A point inside a prop's roots
  rootAt(px, py) {
    const tm = this.tm, tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (!tm.inBounds(tx, ty)) return false;
    const roots = this.byTile.get(tm.idx(tx, ty));
    return Boolean(roots && roots.some((r) => px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h));
  }
}
