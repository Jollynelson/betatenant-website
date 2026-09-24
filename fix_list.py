import re
import os

filepath = 'src/app/tenant-switch/list/page.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Remove APARTMENT_TYPES
content = re.sub(r'const\s+APARTMENT_TYPES\s*=\s*\[[\s\S]*?\]\s*as\s*const;\n?', '', content)

# 2. Replace APARTMENT_TYPES.map
content = re.sub(
    r'\{APARTMENT_TYPES\.map\(t\s*=>\s*\([\s\S]*?<label key=\{t\.value\}[\s\S]*?apartmentType === t\.value[\s\S]*?apartmentType === t\.value\}[\s\S]*?\{t\.label\}[\s\S]*?<\/label>\s*\)\)\}',
    r'''{countryPack?.propertyTypes?.map((t) => (
                <label key={t.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                  apartmentType === t.key ? "border-bt-primary bg-bt-primary/5 text-bt-primary font-medium" : "border-neutral-200 hover:border-neutral-300"
                }`}>
                  <input type="radio" name="apartmentType" value={t.key} checked={apartmentType === t.key}
                    onChange={e => {
                      setApartmentType(e.target.value);
                      const def = ROOM_DEFAULTS[e.target.value];
                      if (def) { setRoomCount(def.rooms); setBathroomCount(def.baths); }
                    }}
                    className="w-4 h-4 text-bt-primary border-neutral-300 focus:ring-bt-primary"
                  />
                  {t.label}
                </label>
              ))}''',
    content
)

# 3. locationData.map for state
content = re.sub(
    r'\{locationData\.map\(l => <option key=\{l\.state\} value=\{l\.state\}>\{l\.state\}<\/option>\)\}',
    r'{countryPack?.regions?.map((r) => (<option key={r.key} value={r.value || r.key}>{r.name}</option>))}',
    content
)

# 4. Remove locationData import
content = re.sub(r'import\s+{\s*locationData\s*}\s*from\s*["\']@/lib/locations["\'];\n?', '', content)

# 5. Remove citiesForState
content = re.sub(r'const\s+citiesForState\s*=\s*locationData[^;]+;\n?', '', content)

# 6. Pricing Models in list/page.tsx
# StepPricing
# wait, my node script did half of StepPricing. Let's look at what's in there.
with open(filepath, 'w') as f:
    f.write(content)
