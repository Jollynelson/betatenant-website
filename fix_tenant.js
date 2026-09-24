const fs = require('fs');

function fixPageTsx() {
  let code = fs.readFileSync('src/app/tenant-switch/list/page.tsx', 'utf8');

  // 1. Remove import locationData
  code = code.replace(/import { locationData } from "@\/lib\/locations";\n/, "");

  // 2. Remove APARTMENT_TYPES
  code = code.replace(/const APARTMENT_TYPES = \[\s*\{ label: "Single room\/Shared apartment", value: "single-room\/shared-apartment" \},\s*\{ label: "Self Contained Apartment", value: "self-contained" \},\s*\{ label: "Mini flat\/One bedroom", value: "mini-flat\/one-bedroom" \},\s*\{ label: "Two bedroom flat", value: "two-bedroom" \},\s*\{ label: "Three bedroom flat", value: "three-bedroom" \},\s*\{ label: "Four bedroom flat", value: "four-bedroom" \},\s*\{ label: "Big family house\/4\+ Bedrooms", value: "big-family-house-4plus" \},\s*\] as const;\n/, "");

  // 3. Inject useCountry
  if (!code.includes("import { useCountry }")) {
    code = code.replace(/import { AuthGuard } from "@\/components\/auth-guard";/, 'import { AuthGuard } from "@/components/auth-guard";\nimport { useCountry } from "@/components/CountryProvider";');
  }

  code = code.replace(/function StepCreate\(\{[\s\S]*?\}\) \{/, (match) => match + "\n  const { countryPack } = useCountry();");
  code = code.replace(/function StepPricing\(\{[\s\S]*?\}\) \{/, (match) => match + "\n  const { countryPack } = useCountry();");
  code = code.replace(/function StepPreview\(\{[\s\S]*?\}\) \{/, (match) => match + "\n  const { countryPack } = useCountry();");
  code = code.replace(/function NewListingContent\(\) \{/, (match) => match + "\n  const { countryPack } = useCountry();");

  // 4. Replace citiesForState
  code = code.replace(/const citiesForState = locationData\.find\(\(l\) => l\.state === propertyState\)\?\.cities \?\? \[\];\n/, "");

  // 5. Replace state select map
  code = code.replace(/\{locationData\.map\(\(l\) => \(\s*<option key=\{l\.state\} value=\{l\.state\}>\{l\.state\}<\/option>\s*\)\)\}/, "{countryPack?.regions?.map((r) => (<option key={r.key} value={r.value || r.key}>{r.name}</option>))}");

  // 6. Replace LGA select block completely
  code = code.replace(/<div>\s*<label className="block text-sm font-medium text-neutral-700 mb-1\.5">Town\/LGA<\/label>\s*<select[\s\S]*?<\/select>\s*<\/div>/, `{((countryPack?.geographySchema?.length || 0) > 1) && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Town/LGA</label>
              <input
                type="text"
                value={propertyLGA}
                onChange={(e) => setPropertyLGA(e.target.value)}
                placeholder="Enter Town/LGA"
                disabled={!propertyState}
                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/30 disabled:opacity-50"
              />
            </div>
          )}`);

  // 7. Replace APARTMENT_TYPES map
  code = code.replace(/\{APARTMENT_TYPES\.map\(\(t\) => \(\s*<option key=\{t\.value\} value=\{t\.value\}>\{t\.label\}<\/option>\s*\)\)\}/, "{countryPack?.propertyTypes?.map((pt) => (<option key={pt.key} value={pt.key}>{pt.label}</option>))}");

  // 8. Replace StepPricing completely to handle pricingModels mapping. (Will leave fee variables mapped as `const [fees, setFees]`)
  const pricingStart = code.indexOf("function StepPricing({");
  const pricingEnd = code.indexOf("function StepPreview({");
  const origPricing = code.substring(pricingStart, pricingEnd);

  let newPricing = origPricing
    .replace(/const \[listingFee, setListingFee\] = useState\("0"\);\n\s*const \[cautionFee, setCautionFee\] = useState\("0"\);\n\s*const \[inspectionFee, setInspectionFee\] = useState\("0"\);\n\s*const \[serviceCharge, setServiceCharge\] = useState\("0"\);\n\s*const \[lawyerFee, setLawyerFee\] = useState\("0"\);\n\s*const \[cleaningFee, setCleaningFee\] = useState\("0"\);/, "const [fees, setFees] = useState<Record<string, string>>({});")
    .replace(/setListingFee\(formatCurrency\(safeParse\(String\(p\?\.listingFee \?\? 0\)\)\)\);\n\s*setCautionFee\(formatCurrency\(safeParse\(String\(p\?\.cautionFee \?\? 0\)\)\)\);\n\s*setInspectionFee\(formatCurrency\(safeParse\(String\(p\?\.inspectionFee \?\? 0\)\)\)\);\n\s*setServiceCharge\(formatCurrency\(safeParse\(String\(p\?\.serviceCharge \?\? 0\)\)\)\);\n\s*setLawyerFee\(formatCurrency\(safeParse\(String\(p\?\.lawyerFee \?\? 0\)\)\)\);\n\s*setCleaningFee\(formatCurrency\(safeParse\(String\(p\?\.cleaningFee \?\? 0\)\)\)\);/, "const initialFees: Record<string, string> = {};\n      countryPack?.pricingModels?.forEach(model => {\n        initialFees[model.feeKey] = formatCurrency(safeParse(String(p?.[model.feeKey] ?? 0)));\n      });\n      setFees(initialFees);")
    .replace(/const serviceChargeNum = safeParse\(serviceCharge\);\n\s*const data = \{\n\s*listingFee: safeParse\(listingFee\),\n\s*cautionFee: safeParse\(cautionFee\),\n\s*inspectionFee: safeParse\(inspectionFee\),\n\s*serviceCharge: serviceChargeNum,\n\s*lawyerFee: safeParse\(lawyerFee\),\n\s*cleaningFee: safeParse\(cleaningFee\),\n\s*\};/, "const data: Record<string, number> = {};\n    countryPack?.pricingModels?.forEach(model => {\n      data[model.feeKey] = safeParse(fees[model.feeKey] || \"0\");\n    });\n    const serviceChargeNum = data['serviceCharge'] || 0;");

  // Replace form in Pricing
  newPricing = newPricing.replace(/<form onSubmit=\{handleSubmit\}>[\s\S]*?<\/form>/, `<form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {countryPack?.pricingModels?.map(model => (
            <div key={model.feeKey}>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">{model.label} {model.required && <span className="text-red-500">*</span>}</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">{countryPack?.currencySymbol}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required={model.required}
                  value={fees[model.feeKey] || ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\\d]/g, "") || "0";
                    setFees(prev => ({ ...prev, [model.feeKey]: formatCurrency(parseInt(raw)) }));
                  }}
                  placeholder="0"
                  className="w-full bg-white border border-neutral-200 rounded-xl pl-8 pr-16 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-bt-primary/30"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs uppercase bg-neutral-100 px-2 py-0.5 rounded-md font-medium">/{model.type.replace("-time", "")}</span>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3 mt-8">{error}</p>}

        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-10 pt-6 border-t border-neutral-200">
          <button type="button" onClick={onBack}
            className="px-6 py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
            Back to Details
          </button>
          <button type="submit" disabled={isUpdating}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-bt-primary text-white font-medium text-sm hover:bg-bt-primary-light transition-colors disabled:opacity-60">
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isUpdating ? "Saving..." : "Save Pricing & Continue"}
          </button>
        </div>
      </form>`);

  newPricing = newPricing.replace(/<p className="text-4xl font-bold text-neutral-800">₦\{listingFee\}<\/p>/, '<p className="text-4xl font-bold text-neutral-800">{countryPack?.currencySymbol}{fees["listingFee"] || "0"}</p>');
  newPricing = newPricing.replace(/<p className="text-sm text-neutral-500 mt-1">₦\{formatCurrency\(total\)\} total with all fees<\/p>/, '<p className="text-sm text-neutral-500 mt-1">{countryPack?.currencySymbol}{formatCurrency(Object.values(fees).reduce((acc, curr) => acc + safeParse(curr), 0))} total with all fees</p>');

  code = code.substring(0, pricingStart) + newPricing + code.substring(pricingEnd);

  // 9. Fix Preview ₦ replacements
  code = code.replace(/₦\{Number\(house\.listingFee \?\? 0\)\.toLocaleString\(\)\}/g, "{countryPack?.currencySymbol}{Number(house.listingFee ?? 0).toLocaleString()}");
  code = code.replace(/>₦\{/g, ">{countryPack?.currencySymbol}{");

  fs.writeFileSync('src/app/tenant-switch/list/page.tsx', code);
}

fixPageTsx();
