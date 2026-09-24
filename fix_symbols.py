import re
import os

files_to_process = [
    "src/app/host/new/page.tsx",
    "src/app/host/edit/[id]/client.tsx",
    "src/app/tenant-switch/list/page.tsx",
    "src/app/tenant-switch/page.tsx"
]

def process_file(filepath):
    if not os.path.exists(filepath):
        return
        
    with open(filepath, "r") as f:
        content = f.read()

    # handle JSX strings: "₦" -> {countryPack?.currencySymbol}
    content = re.sub(r'>₦<', '>{countryPack?.currencySymbol}<', content)
    content = re.sub(r'\(₦\)', '({countryPack?.currencySymbol})', content)
    content = re.sub(r'>₦', '>{countryPack?.currencySymbol}', content)
    content = re.sub(r'₦\{', '{countryPack?.currencySymbol}{', content)
    content = re.sub(r'₦(\d+)', r'{countryPack?.currencySymbol}\1', content)
    
    # handle template literals: `₦${` -> `${countryPack?.currencySymbol}${`
    content = re.sub(r'`₦\$\{', r'`${countryPack?.currencySymbol}${', content)

    # remove locationData import if remaining
    content = re.sub(r'import\s+{\s*locationData\s*}\s*from\s*["\']@/lib/locations["\'];\n?', '', content)

    # remove APARTMENT_TYPES if remaining
    content = re.sub(r'const\s+APARTMENT_TYPES\s*=\s*\[[\s\S]*?\]\s*as\s*const;\n?', '', content)

    # any remaining APARTMENT_TYPES map?
    content = re.sub(
        r'{APARTMENT_TYPES\.map\(\(t\)\s*=>\s*\(\s*<option\s+key={t\.value}\s+value={t\.value}>\s*{t\.label}\s*</option>\s*\)\)}',
        r'{countryPack?.propertyTypes?.map((pt) => (\n                      <option key={pt.key} value={pt.key}>{pt.label}</option>\n                    ))}',
        content
    )
    
    # APARTMENT_TYPES mapping in edit:
    # {APARTMENT_TYPES.map((t) => ( <option key={t.value} value={t.value}>{t.label}</option> ))}
    content = re.sub(
        r'{APARTMENT_TYPES\.map\(\([^)]*\)\s*=>\s*\(\s*<option\s+key={[^\}]+}\s+value={[^\}]+}>\s*{[^\}]+}\s*</option>\s*\)\)}',
        r'{countryPack?.propertyTypes?.map((pt) => (\n                      <option key={pt.key} value={pt.key}>{pt.label}</option>\n                    ))}',
        content
    )

    with open(filepath, "w") as f:
        f.write(content)

for filepath in files_to_process:
    process_file(filepath)
