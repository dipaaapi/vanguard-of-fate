// Editable Aseprite sources for currency and every consumable. Repaint only unedited sources.
import { Canvas, hex, mixc } from "./kit.mjs";
import { writeAse } from "../asefile.mjs";
import { SRC_DIR, ROOT, writePng } from "../lib.mjs";
import { load } from "../../../scripts/headless.mjs";
import path from "node:path";
import fs from "node:fs";

const H = hex;
const ink = H("#101420"), glass = [H("#304866"), H("#6182a0"), H("#a5cad8"), H("#ecf9ee")];
export const COIN_PALETTES = {
  bronze: ["#563323", "#945431", "#cd894b", "#f5c886"],
  silver: ["#384c67", "#69839d", "#b1c9dc", "#f0f7ff"],
  gold: ["#714316", "#b77b25", "#efbd4e", "#fff0af"],
  platinum: ["#315663", "#5d9aa7", "#a7e5e3", "#f4ffff"]
};

function coin(kind) {
  const c = new Canvas(24, 24), ramp = COIN_PALETTES[kind].map(H);
  c.blob(12, 14, 9, 8, [ramp[0], ramp[0], ramp[1]]);
  c.blob(12, 11, 9, 8, ramp, { rim: ramp[3] });
  c.blob(12, 11, 6, 5, [ramp[0], ramp[1], ramp[2]]);
  // Four unmistakable mint marks: chevron, crescent, crown and star.
  if (kind === "bronze") { c.line(9, 9, 12, 13, 1, ramp[3]); c.line(12, 13, 15, 9, 1, ramp[3]); }
  if (kind === "silver") { c.blob(12, 11, 3, 4, [ramp[3]]); c.blob(14, 10, 3, 3, [ramp[1]]); }
  if (kind === "gold") { c.poly([[8, 9], [10, 11], [12, 7], [14, 11], [16, 9], [15, 14], [9, 14]], ramp[3]); }
  if (kind === "platinum") c.poly([[12, 6], [14, 10], [18, 11], [14, 13], [12, 17], [10, 13], [6, 11], [10, 10]], ramp[3]);
  c.outline(ink);
  return c;
}

function consumable(it) {
  const c = new Canvas(24, 24), tint = H(it.tint || "#63c49e"),
    ramp = [mixc(tint, ink, 0.65), mixc(tint, ink, 0.3), tint, mixc(tint, H("#ffffff"), 0.5)];
  if (it.icon === "potion" || it.icon === "essence") {
    const shapes = { salve: [7, 7], elixir: [6, 8], tonic: [5, 7], panacea: [7, 6] };
    const [rx, ry] = shapes[it.base] || [6, 7];
    c.blob(12, 15, rx, ry, glass, { rim: glass[3] });
    c.blob(12, 16, rx - 1, ry - 2, ramp, { flat: 21 });
    c.poly([[8, 6], [16, 6], [15, 10], [9, 10]], glass[1]);
    c.line(9, 5, 14, 5, 2, H("#916344"));
    c.line(9, 4, 14, 4, 1, H("#dcb68a"));
    c.line(8, 12, 8, 15, 1, glass[3]);
    c.line(8, 17, 9, 19, 1, glass[2]);
    c.line(10, 16, 14, 16, 1, H("#f8e9bf"));
    if (it.base === "salve") c.line(12, 14, 12, 18, 1, H("#f8e9bf"));
    if (it.base === "panacea") c.line(10, 15, 14, 18, 1, H("#24573e"));
    if (it.base === "tonic") c.poly([[13, 12], [9, 16], [12, 16], [10, 20], [15, 15], [12, 15]], H("#72420e"));
  } else if (it.base === "soulstone" || it.icon === "shard") {
    c.poly([[12, 2], [19, 9], [17, 18], [12, 22], [6, 17], [5, 8]], ramp[0]);
    c.poly([[12, 3], [17, 9], [12, 19], [7, 9]], ramp[2]);
    c.poly([[12, 3], [12, 19], [7, 9]], ramp[3]);
    c.line(12, 4, 12, 17, 1, H("#ffffff"));
    if (it.base === "soulstone") { c.blob(12, 11, 3, 4, [H("#422066"), H("#faf0ff")]); c.spark(20, 4, ramp[3], true); c.spark(3, 18, ramp[2]); }
  } else if (it.base === "mushroom") {
    c.poly([[10, 12], [14, 12], [16, 21], [8, 21]], H("#e3c6aa"));
    c.blob(12, 11, 9, 7, ramp, { flat: 13, rim: ramp[3] });
    for (const [x, y] of [[8, 8], [14, 6], [16, 10]]) c.blob(x, y, 1.5, 1, [H("#f3dfbf")]);
  } else if (it.icon === "herb") {
    c.line(8, 21, 14, 5, 1, H("#638b44"));
    for (const [x, y, lean] of [[7, 8, -0.5], [16, 10, 0.5], [8, 14, -0.5], [15, 17, 0.5]])
      c.blob(x, y, 3, 4, ramp, { lean, rim: ramp[3] });
    c.line(8, 20, 13, 20, 1, H("#dab981"));
  } else {
    // Cooked dishes retain their ingredient colours, presented in a glazed bowl.
    c.blob(12, 16, 10, 6, glass, { flat: 21 });
    c.blob(12, 12, 9, 4, [H("#5b3826"), H("#bf854a"), H("#efc587")]);
    c.blob(12, 11, 7, 3, ramp);
    c.line(4, 15, 19, 15, 1, glass[3]);
    c.line(8, 7, 7, 4, 1, H("#b7ced0"));
    c.line(14, 6, 15, 3, 1, H("#b7ced0"));
    c.spark(9, 11, H("#a5d16e")); c.spark(15, 10, H("#f0c89e"));
  }
  c.outline(ink);
  return c;
}

function frame(w, h) {
  const c = new Canvas(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const edge = Math.min(x, y, w - 1 - x, h - 1 - y);
    let col = edge === 0 ? ink : edge === 1 ? H("#c49a57") : edge === 2 ? H("#5e4832")
      : edge === 3 ? H("#273d4c") : H((x + y) % 5 === 0 ? "#182735" : "#14212d");
    if (edge < 4 && ((x < 5 || x > w - 6) && (y < 5 || y > h - 6))) col = H("#83babc");
    c.set(x, y, col);
  }
  return c;
}

export async function paintEconomy() {
  const { codexItems } = await load("js/items/itemdb.js");
  const icons = Object.fromEntries(Object.keys(COIN_PALETTES).map(k => [`coin_${k}`, coin(k)]));
  for (const it of codexItems().other.filter(it => it.type === "consume")) icons[`item_${it.base}`] = consumable(it);
  icons.wallet = frame(64, 28);
  icons.consumable_slot = frame(32, 32);
  for (const [key, c] of Object.entries(icons)) {
    writeAse(path.join(SRC_DIR, "ui", `${key}.aseprite`), { w: c.w, h: c.h, layer: "art", frames: [{ rgba: c.rgba(), duration: 0.12 }] });
  }
  const cols = 8, cell = 40, rows = Math.ceil(Object.keys(icons).length / cols);
  const sheet = new Canvas(cols * cell, rows * cell);
  Object.values(icons).forEach((c, i) => sheet.blit(c, (i % cols) * cell + 4, Math.floor(i / cols) * cell + 4));
  const out = path.join(ROOT, ".codex", "economy-art.png");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  writePng(out, sheet.w, sheet.h, sheet.rgba());
  // A manifest makes browser loading and source/export checks use the same list.
  fs.writeFileSync(path.join(ROOT, "assets", "ui", "economy.json"), JSON.stringify(Object.keys(icons), null, 2) + "\n");
  console.log(`Painted ${Object.keys(icons).length} Aseprite sources; preview: ${out}`);
}

await paintEconomy();
