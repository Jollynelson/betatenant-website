const fs = require('fs');

function inject(file, marker, injection) {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes(injection.trim())) {
    code = code.replace(marker, marker + "\n  " + injection);
    fs.writeFileSync(file, code);
  }
}

// host/new/page.tsx
const newPage = "src/app/host/new/page.tsx";
if (fs.existsSync(newPage)) {
  inject(newPage, "const [apartmentType, setApartmentType] = useState(\"\");", "const { countryPack } = useCountry();");
  inject(newPage, "const [listingFee, setListingFee] = useState(\"0\");", "const { countryPack } = useCountry();");
  inject(newPage, "const [house, setHouse] = useState<any>(null);", "const { countryPack } = useCountry();");
  inject(newPage, "const [step, setStep] = useState(0);", "const { countryPack } = useCountry();");
  
  let code = fs.readFileSync(newPage, 'utf8');
  
  // replace APARTMENT_TYPES.map
  code = code.replace(
    /\{APARTMENT_TYPES\.map\(\(t\) => \([\s\S]*?\}\)\)}/,
    `{countryPack?.propertyTypes?.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}`
  );

  // replace the LGA block
  code = code.replace(
    /<div>\s*<label className="block text-sm font-medium text-neutral-700 mb-2">LGA[\s\S]*?<\/div>\s*<\/div>/,
    `{((countryPack?.geographySchema?.length || 0) > 1) && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  LGA / Town
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="propertyLGA"
                    value={propertyLGA}
                    onChange={(e) => setPropertyLGA(e.target.value)}
                    placeholder="Enter LGA or Town"
                    disabled={!propertyState}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/30 disabled:bg-neutral-50 disabled:opacity-50"
                  />
                </div>
              </div>
            )}`
  );
  
  // Also we need to check if there is a second place with propertyLGA
  
  fs.writeFileSync(newPage, code);
}
