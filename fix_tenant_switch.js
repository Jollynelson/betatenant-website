const fs = require('fs');

let file = 'src/app/tenant-switch/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Inject useCountry
if (!code.includes("const { countryPack } = useCountry();") && code.includes("function LocationFilter")) {
  code = code.replace(/function LocationFilter\(\{.*?\}\) \{/, (match) => {
    return match + "\n  const { countryPack } = useCountry();";
  });
}

// Ensure useCountry is imported
if (!code.includes("import { useCountry }")) {
  code = code.replace(/import { useState[^]*? } from "react";/, (match) => {
    return match + '\nimport { useCountry } from "@/components/CountryProvider";';
  });
}

code = code.replace(/const states = locationData\.map\(d => d\.state\);\n\s*const lgas\s*=\s*locationData\.find\(d => d\.state === state\)\?\.cities \?\? \[\];/, "");

code = code.replace(
  /<option value="">All States<\/option>\s*\{states\.map\(s => <option key=\{s\} value=\{s\}>\{s\}<\/option>\)\}/,
  `<option value="">All States</option>\n          {countryPack?.regions?.map(r => <option key={r.key} value={r.value || r.key}>{r.name}</option>)}`
);

// LGA block
code = code.replace(
  /\{state && \([\s\S]*?<div className="relative">\s*<select[\s\S]*?<\/select>\s*<ChevronDown[\s\S]*?<\/div>\s*\)\}/,
  `{((countryPack?.geographySchema?.length || 0) > 1) && state && (
        <div className="relative">
          <input
            type="text"
            value={lga}
            onChange={e => onLgaChange(e.target.value)}
            placeholder="Town/LGA"
            className="appearance-none pl-3 pr-8 py-2 rounded-full border border-neutral-200 bg-white text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all cursor-text"
          />
        </div>
      )}`
);

fs.writeFileSync(file, code);
