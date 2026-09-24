const fs = require('fs');

let code = fs.readFileSync('src/app/host/edit/[id]/client.tsx', 'utf8');

// Replace statesData and lgaList definitions
code = code.replace(/const statesData = locationData\.map\(\(d\) => d\.state\);\n\s*const lgaList = locationData\.find\(\(d\) => d\.state === state\)\?\.cities \?\? \[\];/, "");

// Replace state select
code = code.replace(
  /<Field label="State">\s*<select value=\{state\}[\s\S]*?<\/select>\s*<\/Field>/,
  `<Field label="State">
              <select value={state} onChange={(e) => { setState(e.target.value); setLga(""); }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all">
                <option value="">Select state</option>
                {countryPack?.regions?.map((r) => <option key={r.key} value={r.value || r.key}>{r.name}</option>)}
              </select>
            </Field>`
);

// Replace lga select
code = code.replace(
  /\{state && \(\s*<Field label="City \/ LGA">\s*<select value=\{lga\}[\s\S]*?<\/select>\s*<\/Field>\s*\)\}/,
  `{((countryPack?.geographySchema?.length || 0) > 1) && (
              <Field label="City / LGA">
                <input type="text" value={lga} onChange={(e) => setLga(e.target.value)}
                  placeholder="Enter Town/LGA" disabled={!state}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-bt-primary/20 focus:border-bt-primary transition-all disabled:opacity-50" />
              </Field>
            )}`
);

// We need to inject `const { countryPack } = useCountry();` if not exists
if (!code.includes("const { countryPack } = useCountry();")) {
  code = code.replace("function EditListingContent({ id }: { id: string }) {", "function EditListingContent({ id }: { id: string }) {\n  const { countryPack } = useCountry();\n");
}

fs.writeFileSync('src/app/host/edit/[id]/client.tsx', code);
