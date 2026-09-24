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
        print(f"File {filepath} not found.")
        return
        
    with open(filepath, "r") as f:
        content = f.read()

    # 1. Remove import { locationData }
    content = re.sub(r'import\s+{\s*locationData\s*}\s*from\s*["\']@/lib/locations["\'];\n?', '', content)

    # 1.5 Add import { useCountry }
    if 'useCountry' not in content:
        # Add after other imports
        content = re.sub(
            r'(import\s+.*?\s+from\s+["\'][^"\']+["\'];\n)', 
            r'\1import { useCountry } from "@/components/CountryProvider";\n', 
            content, 
            count=1
        )

    # 2. Remove APARTMENT_TYPES
    content = re.sub(r'const\s+APARTMENT_TYPES\s*=\s*\[[\s\S]*?\]\s*as\s*const;\n?', '', content)

    # 3. Add useCountry to components
    # Find components that need it (StepCreate, StepPricing, StepPreview, EditListingContent, TenantSwitchList, TenantSwitchPage, etc.)
    # We can match `function XXX(...) {` or `const XXX = (...) => {`
    component_names = ["StepCreate", "StepPricing", "StepPreview", "EditListingContent", "TenantSwitchList", "TenantSwitchPage", "TenantSwitchContent"]
    
    for comp in component_names:
        # function Comp() {
        content = re.sub(
            rf'(function\s+{comp}\s*\([^)]*\)\s*{{)',
            r'\1\n  const { countryPack } = useCountry();\n',
            content
        )
        # const Comp = () => {
        content = re.sub(
            rf'(const\s+{comp}\s*=\s*\([^)]*\)\s*=>\s*{{)',
            r'\1\n  const { countryPack } = useCountry();\n',
            content
        )

    # 4. Replace citiesForState logic
    content = re.sub(
        r'const\s+citiesForState\s*=\s*locationData[^;]+;\n?',
        '',
        content
    )

    # 5. Replace state select
    state_select_pattern = re.compile(
        r'<select[^>]*name="propertyState"[^>]*>.*?{locationData\.map\(\(l\)\s*=>\s*\(.*?<option[^>]*value={l\.state}[^>]*>.*?{l\.state}.*?</option>.*?\).*?</select>',
        re.DOTALL
    )
    # wait, the original was:
    # {locationData.map((l) => (
    #   <option key={l.state} value={l.state}>{l.state}</option>
    # ))}
    # Let's just do a simpler replace on the map part
    content = re.sub(
        r'{locationData\.map\(\(l\)\s*=>\s*\(\s*<option\s+key={l\.state}\s+value={l\.state}>\s*{l\.state}\s*</option>\s*\)\)}',
        r'{countryPack?.regions?.map((r) => (\n                      <option key={r.key} value={r.value || r.key}>{r.name}</option>\n                    ))}',
        content
    )
    # also for tenant switch where state might be named differently
    content = re.sub(
        r'{locationData\.map\(\(loc\)\s*=>\s*\(\s*<option\s+key={loc\.state}\s+value={loc\.state}>\s*{loc\.state}\s*</option>\s*\)\)}',
        r'{countryPack?.regions?.map((r) => (\n                      <option key={r.key} value={r.value || r.key}>{r.name}</option>\n                    ))}',
        content
    )

    # 6. Replace LGA select with conditional text input
    lga_block_pattern = re.compile(
        r'<div[^>]*>\s*<label[^>]*>LGA.*?</label>.*?<select[^>]*name="propertyLGA".*?</select>.*?</div>\s*</div>',
        re.DOTALL
    )
    
    # We will just replace the map part for LGA first, but wait, the prompt says:
    # "Change the LGA/Town select into a text input, and conditionally render it only if (countryPack?.geographySchema?.length || 0) > 1"
    
    # Let's replace the whole LGA div block.
    # It might be easier to use python to just find `name="propertyLGA"` and replace the `select` with `input`
    # and wrap the parent in `{((countryPack?.geographySchema?.length || 0) > 1) && ( ... )}`
    
    # 7. Replace APARTMENT_TYPES.map
    content = re.sub(
        r'{APARTMENT_TYPES\.map\(\(t\)\s*=>\s*\(\s*<option\s+key={t\.value}\s+value={t\.value}>\s*{t\.label}\s*</option>\s*\)\)}',
        r'{countryPack?.propertyTypes?.map((pt) => (\n                      <option key={pt.key} value={pt.key}>{pt.label}</option>\n                    ))}',
        content
    )

    # 8. Pricing models dynamically mapped
    # This is complex because state variables like `listingFee` were explicitly defined.
    # Let's see if we can just write a general replacement or if we have to write a custom node script.

    with open(filepath, "w") as f:
        f.write(content)
    print(f"Processed {filepath}")

for filepath in files_to_process:
    process_file(filepath)
