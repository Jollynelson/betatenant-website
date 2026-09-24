import re
import os

filepath = 'src/app/host/edit/[id]/client.tsx'
with open(filepath, 'r') as f:
    content = f.read()
content = re.sub(r'const\s+APARTMENT_TYPES\s*=\s*\[[\s\S]*?\]\s*as\s*const;\n?', '', content)
content = re.sub(
    r'\{APARTMENT_TYPES\.map\(\(t\)\s*=>\s*\([\s\S]*?<button key=\{t\.value\}.*?handleTypeChange\(t\.value\)[\s\S]*?apartmentType === t\.value[\s\S]*?\{t\.label\}<\/button>\s*\)\)\}',
    r'''{countryPack?.propertyTypes?.map((t) => (
              <button key={t.key} onClick={() => handleTypeChange(t.key)}
                className={cn(
                  "px-3 py-2.5 rounded-xl border text-sm text-left transition-all",
                  apartmentType === t.key
                    ? "border-bt-primary bg-bt-primary/5 text-bt-primary font-semibold"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                )}
              >
                {t.label}
              </button>
            ))}''',
    content
)
with open(filepath, 'w') as f:
    f.write(content)

filepath = 'src/app/tenant-switch/list/page.tsx'
with open(filepath, 'r') as f:
    content = f.read()
content = re.sub(r'const\s+APARTMENT_TYPES\s*=\s*\[[\s\S]*?\]\s*as\s*const;\n?', '', content)
content = re.sub(
    r'\{APARTMENT_TYPES\.map\(t\s*=>\s*\([\s\S]*?<label key=\{t\.value\}[\s\S]*?apartmentType === t\.value[\s\S]*?apartmentType === t\.value\}[\s\S]*?\{t\.label\}[\s\S]*?<\/label>\s*\)\)\}',
    r'''{countryPack?.propertyTypes?.map(t => (
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
with open(filepath, 'w') as f:
    f.write(content)

