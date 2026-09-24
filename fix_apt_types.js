const fs = require('fs');

const files = [
  "src/app/host/new/page.tsx",
  "src/app/host/edit/[id]/client.tsx",
  "src/app/tenant-switch/list/page.tsx"
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let code = fs.readFileSync(f, 'utf8');

  // Replace definition
  code = code.replace(/const\s+APARTMENT_TYPES\s*=\s*\[[\s\S]*?\]\s*as\s*const;\n?/, "");

  // Replace map
  code = code.replace(
    /\{APARTMENT_TYPES\.map\([\s\S]*?<\/option>\s*\)\)\}/g,
    `{countryPack?.propertyTypes?.map((pt) => (<option key={pt.key} value={pt.key}>{pt.label}</option>))}`
  );

  fs.writeFileSync(f, code);
});
