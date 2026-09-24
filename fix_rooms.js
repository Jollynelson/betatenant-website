const fs = require('fs');

const f = 'src/app/tenant-switch/list/page.tsx';
let code = fs.readFileSync(f, 'utf8');
code = code.replace(
  /const def = ROOM_DEFAULTS\[e\.target\.value\];\s*if \(def\) \{ setRoomCount\(def\.rooms\); setBathroomCount\(def\.baths\); \}/g,
  `const rm: Record<string, number> = { "single-room/shared-apartment": 1, "self-contained": 1, "mini-flat/one-bedroom": 1, "two-bedroom": 2, "three-bedroom": 3, "four-bedroom": 4, "big-family-house-4plus": 4 };
                      setRoomCount(rm[e.target.value] ?? 1); setBathroomCount(1);
                      if (e.target.value === "self-contained" || e.target.value === "mini-flat/one-bedroom") setLivingRoomCount(0);
                      else if (livingRoomCount === 0 && e.target.value !== "single-room/shared-apartment") setLivingRoomCount(1);`
);
fs.writeFileSync(f, code);
