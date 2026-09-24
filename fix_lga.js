const fs = require('fs');

let code = fs.readFileSync('src/app/host/new/page.tsx', 'utf8');

const regexLga = /<div>\s*<label className="block text-sm font-medium text-neutral-700 mb-1\.5">Town\/LGA<\/label>\s*<select[\s\S]*?<\/select>\s*<\/div>/;

code = code.replace(regexLga, 
`{((countryPack?.geographySchema?.length || 0) > 1) && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Town/LGA</label>
              <input
                type="text"
                value={propertyLGA}
                onChange={(e) => setPropertyLGA(e.target.value)}
                placeholder="Enter Town/LGA"
                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/30"
              />
            </div>
          )}`);

code = code.replace(/const citiesForState = locationData\.find\(\(l\) => l\.state === propertyState\)\?\.cities \?\? \[\];\n?/, "");

// Find and replace hardcoded ₦ with countryPack?.currencySymbol
code = code.replace(/₦\{/g, '{countryPack?.currencySymbol}{');
code = code.replace(/>₦/g, '>{countryPack?.currencySymbol}');
code = code.replace(/"₦"/g, 'countryPack?.currencySymbol || "₦"');
code = code.replace(/₦([^<]*)/g, '{countryPack?.currencySymbol}$1'); // this might be risky, let's just do the main ones

fs.writeFileSync('src/app/host/new/page.tsx', code);
