import { locationData } from "./locations";

export interface PresetLocation {
  name: string;
  lga: string;
  state: string;
}

// Curated list of all preset locations supported with rich intelligence on Beta Tenant
export const PRESET_LOCATIONS: PresetLocation[] = [
  // Akwa Ibom Hubs
  { name: "Uyo", lga: "Uyo", state: "Akwa Ibom" },
  { name: "Ewet Housing", lga: "Uyo", state: "Akwa Ibom" },
  { name: "Shelter Afrique", lga: "Uyo", state: "Akwa Ibom" },
  { name: "Osongama Estate", lga: "Uyo", state: "Akwa Ibom" },
  { name: "Itiam Etoi", lga: "Uyo", state: "Akwa Ibom" },
  { name: "Eket", lga: "Eket", state: "Akwa Ibom" },
  { name: "Ikot Ekpene", lga: "Ikot Ekpene", state: "Akwa Ibom" },
  { name: "Oron", lga: "Oron", state: "Akwa Ibom" },

  // Lagos Major Hubs
  { name: "Yaba", lga: "Lagos Mainland", state: "Lagos" },
  { name: "Gbagada", lga: "Kosofe", state: "Lagos" },
  { name: "Lekki Phase 1", lga: "Eti-Osa", state: "Lagos" },
  { name: "Lekki", lga: "Eti-Osa", state: "Lagos" },
  { name: "Ikeja", lga: "Ikeja", state: "Lagos" },
  { name: "Surulere", lga: "Surulere", state: "Lagos" },
  { name: "Victoria Island", lga: "Eti-Osa", state: "Lagos" },
  { name: "Ikoyi", lga: "Eti-Osa", state: "Lagos" },
  { name: "Ajah", lga: "Eti-Osa", state: "Lagos" },
  { name: "Magodo", lga: "Kosofe", state: "Lagos" },
  { name: "Maryland", lga: "Kosofe", state: "Lagos" },
  { name: "Ogba", lga: "Ikeja", state: "Lagos" },
  { name: "Alimosho", lga: "Alimosho", state: "Lagos" },
  { name: "Ilupeju", lga: "Mushin", state: "Lagos" },
  { name: "Ogudu", lga: "Kosofe", state: "Lagos" },
  { name: "Ikorodu", lga: "Ikorodu", state: "Lagos" },
  { name: "Festac", lga: "Amuwo-Odofin", state: "Lagos" },
  { name: "Sangotedo", lga: "Eti-Osa", state: "Lagos" },

  // Abuja (FCT) Hubs
  { name: "Wuse 2", lga: "Abuja Municipal", state: "Abuja (FCT)" },
  { name: "Maitama", lga: "Abuja Municipal", state: "Abuja (FCT)" },
  { name: "Garki", lga: "Abuja Municipal", state: "Abuja (FCT)" },
  { name: "Gwarinpa", lga: "Abuja Municipal", state: "Abuja (FCT)" },
  { name: "Jabi", lga: "Abuja Municipal", state: "Abuja (FCT)" },
  { name: "Asokoro", lga: "Abuja Municipal", state: "Abuja (FCT)" },
  { name: "Lugbe", lga: "Abuja Municipal", state: "Abuja (FCT)" },
  { name: "Kubwa", lga: "Bwari", state: "Abuja (FCT)" },
  { name: "Apo", lga: "Abuja Municipal", state: "Abuja (FCT)" },

  // Rivers Hubs
  { name: "Port Harcourt", lga: "Port-Harcourt", state: "Rivers" },
  { name: "Old GRA", lga: "Port-Harcourt", state: "Rivers" },
  { name: "New GRA", lga: "Port-Harcourt", state: "Rivers" },
  { name: "Peter Odili Road", lga: "Port-Harcourt", state: "Rivers" },
  { name: "Woji", lga: "Obio-Akpor", state: "Rivers" },

  // Oyo Hubs
  { name: "Ibadan", lga: "Ibadan", state: "Oyo" },
  { name: "Bodija", lga: "Ibadan", state: "Oyo" },
  { name: "Oluyole", lga: "Oluyole", state: "Oyo" },
  { name: "Ring Road", lga: "Ibadan", state: "Oyo" },

  // Other Commercial Hubs & State Capitals
  { name: "Abeokuta", lga: "Abeokuta South", state: "Ogun" },
  { name: "Benin City", lga: "Egor", state: "Edo" },
  { name: "Enugu", lga: "Enugu", state: "Enugu" },
  { name: "Asaba", lga: "Oshimili South", state: "Delta" },
  { name: "Warri", lga: "Warri", state: "Delta" },
  { name: "Awka", lga: "Awka", state: "Anambra" },
  { name: "Onitsha", lga: "Onitsha", state: "Anambra" },
  { name: "Owerri", lga: "Owerri", state: "Imo" },
  { name: "Calabar", lga: "Calabar", state: "Cross River" },
  { name: "Kano", lga: "Kano Municipal", state: "Kano" },
  { name: "Kaduna", lga: "Kaduna", state: "Kaduna" },
  { name: "Jos", lga: "Jos", state: "Plateau" },
  { name: "Ilorin", lga: "Ilorin South", state: "Kwara" },
  { name: "Akure", lga: "Akure", state: "Ondo" },
  { name: "Osogbo", lga: "Osogbo", state: "Osun" },
  { name: "Lokoja", lga: "Lokoja", state: "Kogi" },
  { name: "Umuahia", lga: "Umuahia North", state: "Abia" },
  { name: "Aba", lga: "Aba South", state: "Abia" },
  { name: "Yenagoa", lga: "Yenagoa", state: "Bayelsa" },
  { name: "Makurdi", lga: "Makurdi", state: "Benue" },
  { name: "Abakaliki", lga: "Abakaliki", state: "Ebonyi" },
  { name: "Ado Ekiti", lga: "Ado Ekiti", state: "Ekiti" },
  { name: "Minna", lga: "Chanchaga", state: "Niger" },
];

/**
 * Search ONLY preset verified locations.
 * Returns matches strictly from PRESET_LOCATIONS or locationData.
 */
export function searchPresetLocations(query: string): PresetLocation[] {
  if (!query || !query.trim()) {
    return PRESET_LOCATIONS.slice(0, 8);
  }

  const q = query.toLowerCase().trim();
  const seen = new Set<string>();
  const results: PresetLocation[] = [];

  // 1. Search primary curated hubs first
  for (const loc of PRESET_LOCATIONS) {
    const key = `${loc.name.toLowerCase()}_${loc.state.toLowerCase()}`;
    if (
      loc.name.toLowerCase().includes(q) ||
      loc.lga.toLowerCase().includes(q) ||
      loc.state.toLowerCase().includes(q)
    ) {
      if (!seen.has(key)) {
        seen.add(key);
        results.push(loc);
      }
    }
  }

  // 2. Search broader locationData for any other official LGA in Nigeria
  for (const item of locationData) {
    if (item.state.toLowerCase().includes(q)) {
      const city = item.cities[0] || item.state;
      const key = `${city.toLowerCase()}_${item.state.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ name: city, lga: city, state: item.state });
      }
    }
    for (const city of item.cities) {
      if (city.toLowerCase().includes(q)) {
        const key = `${city.toLowerCase()}_${item.state.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ name: city, lga: city, state: item.state });
        }
      }
    }
    if (results.length >= 10) break;
  }

  return results.slice(0, 8);
}
