const fs = require('fs');

let code = fs.readFileSync('src/app/tenant-switch/list/page.tsx', 'utf8');

// Replace state variables in StepPricing
code = code.replace(
  /const \[listingFee, setListingFee\][\s\S]*?const \[cleaningFee, setCleaningFee\] = useState\("0"\);/,
  `const [fees, setFees] = useState<Record<string, string>>({});`
);

// Replace useEffect
code = code.replace(
  /useEffect\(\(\) => \{\s*const raw = sessionStorage\.getItem\("propertyToEdit"\);[\s\S]*?\}, \[\]\);/,
  `useEffect(() => {
    const raw = sessionStorage.getItem("propertyToEdit");
    if (raw) {
      const p = JSON.parse(raw);
      const initialFees: Record<string, string> = {};
      countryPack?.pricingModels?.forEach(model => {
        initialFees[model.feeKey] = formatCurrency(safeParse(String(p?.[model.feeKey] ?? 0)));
      });
      setFees(initialFees);
    }
  }, [countryPack]);`
);

// Replace handleSubmit data building
code = code.replace(
  /const serviceChargeNum = safeParse\(serviceCharge\);\s*const data = \{\s*listingFee: safeParse\(listingFee\),[\s\S]*?cleaningFee: safeParse\(cleaningFee\),\s*\};/,
  `const data: Record<string, number> = {};
    countryPack?.pricingModels?.forEach(model => {
      data[model.feeKey] = safeParse(fees[model.feeKey] || "0");
    });
    const serviceChargeNum = data['serviceCharge'] || 0;`
);

// And we need to replace the form rendering where all the fees are manually listed.
const formRegex = /<form onSubmit=\{handleSubmit\}>[\s\S]*?<\/form>/;
const newForm = `<form onSubmit={handleSubmit}>
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
      </form>`;

code = code.replace(formRegex, newForm);

// Also need to fix the summary in the header of StepPricing
code = code.replace(/<p className="text-4xl font-bold text-neutral-800">[^<]+<\/p>/, '<p className="text-4xl font-bold text-neutral-800">{countryPack?.currencySymbol}{fees["listingFee"] || "0"}</p>');
code = code.replace(/<p className="text-sm text-neutral-500 mt-1">[^<]+<\/p>/, '<p className="text-sm text-neutral-500 mt-1">{countryPack?.currencySymbol}{formatCurrency(Object.values(fees).reduce((acc, curr) => acc + safeParse(curr), 0))} total with all fees</p>');

fs.writeFileSync('src/app/tenant-switch/list/page.tsx', code);

// Need to do this for edit too
