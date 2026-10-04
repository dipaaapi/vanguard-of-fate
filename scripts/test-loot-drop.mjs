// Loot never rests where the hero can't walk: drops thrown into walls, trees, water, cliffs and
// unreachable pockets on the hub and every Act platform land on clear, reachable ground.
//   node scripts/test-loot-drop.mjs
import { load, seedRandom } from "./headless.mjs";

seedRandom(7);
const { Stage } = await load("js/stage.js");
const { Platform } = await load("js/world/platform.js");
const { PLATFORM_ORDER } = await load("js/world/platforms.js");
const { findNearestWalkableSpot } = await load("js/loot.js");

const places = [["hub", new Stage()], ...PLATFORM_ORDER.map((id) => [id, new Platform(id)])];
let failures = 0, moved = 0;
for (const [id, stage] of places) {
  const tm = stage.tilemap;
  const blocked = (x, y) => tm.isSolidAt(x, y) || !tm.isReachable(x, y);
  let bad = 0, n = 0;
  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * stage.width, y = Math.random() * stage.height;
    const p = findNearestWalkableSpot(x, y, stage);
    n++;
    if (p.x !== x || p.y !== y) moved++;
    if (blocked(p.x, p.y)) {
      bad++;
      if (bad <= 3) console.log(`  ${id}: (${x | 0}, ${y | 0}) → (${p.x | 0}, ${p.y | 0}) is not walkable`);
    }
  }
  console.log(`${id.padEnd(8)} ${n - bad}/${n} drops land on walkable ground`);
  failures += bad;
}
console.log(`${moved} blocked drops moved; ${failures ? `${failures} FAILED` : "all OK"}`);
process.exit(failures ? 1 : 0);
