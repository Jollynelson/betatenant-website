export interface LocationItem {
  state: string;
  city: string;
}

export const locationData = [
  { state: "Lagos", cities: ["Ajah", "Alimosho", "Ikeja", "Surulere", "Lekki", "Victoria Island", "Ikoyi", "Yaba", "Magodo", "Gbagada", "Maryland", "Ogba", "Berger", "Agege", "Oshodi", "Ikorodu", "Apapa", "Festac", "Ejigbo", "Isolo", "Ojo", "Badagry", "Epe", "Ibeju-Lekki", "Sangotedo", "Amuwo-Odofin", "Eko Atlantic", "Lagos Island", "Mushin", "Kosofe"] },
  { state: "FCT - Abuja", cities: ["Wuse", "Garki", "Maitama", "Asokoro", "Gwarinpa", "Jabi", "Kubwa", "Lugbe", "Karu", "Nyanya", "Dutse", "Bwari", "Kuje", "Gwagwalada", "Abaji", "Central Area", "Utako", "Wuye", "Life Camp", "Katampe"] },
  { state: "Rivers", cities: ["Port Harcourt", "Obio-Akpor", "Eleme", "Oyigbo", "Ikwerre", "Etche", "Bonny", "Degema", "Ahoada", "Omuma"] },
  { state: "Ogun", cities: ["Abeokuta", "Ijebu-Ode", "Sagamu", "Ota", "Ilaro", "Ifo", "Owode", "Mowe", "Ibafo", "Berger"] },
  { state: "Oyo", cities: ["Ibadan", "Ogbomoso", "Oyo", "Iseyin", "Saki", "Eruwa", "Igboho", "Fiditi", "Igbo-Ora", "Lanlate"] },
  { state: "Edo", cities: ["Benin City", "Auchi", "Ekpoma", "Uromi", "Irrua", "Igarra", "Ubiaja", "Fugar", "Sabongida-Ora", "Igueben"] },
  { state: "Delta", cities: ["Warri", "Asaba", "Sapele", "Ughelli", "Agbor", "Ozoro", "Oleh", "Kwale", "Abraka", "Effurun"] },
  { state: "Anambra", cities: ["Awka", "Onitsha", "Nnewi", "Ekwulobia", "Aguata", "Ihiala", "Ogidi", "Nkpor", "Ozubulu", "Uli"] },
  { state: "Enugu", cities: ["Enugu", "Nsukka", "Agbani", "Oji River", "Udi", "Igbo-Etiti", "Awgu", "Aninri", "Nkanu", "Ezeagu"] },
  { state: "Kaduna", cities: ["Kaduna", "Zaria", "Kafanchan", "Kagoro", "Kachia", "Birnin Gwari", "Saminaka", "Giwa", "Igabi", "Chikun"] },
  { state: "Kano", cities: ["Kano", "Fagge", "Dala", "Gwale", "Nassarawa", "Tarauni", "Ungogo", "Kumbotso", "Gezawa", "Wudil"] },
  { state: "Akwa Ibom", cities: ["Uyo", "Eket", "Ikot Ekpene", "Oron", "Abak", "Ikot Abasi", "Itu", "Etinan", "Nsit Ibom", "Uruan"] },
  { state: "Cross River", cities: ["Calabar", "Ikom", "Ogoja", "Obudu", "Ugep", "Akamkpa", "Biase", "Bekwarra", "Obubra", "Yala"] },
  { state: "Imo", cities: ["Owerri", "Orlu", "Okigwe", "Oguta", "Mbaise", "Ngor-Okpala", "Ideato", "Obowo", "Ihitte/Uboma", "Ehime Mbano"] },
  { state: "Abia", cities: ["Aba", "Umuahia", "Ohafia", "Arochukwu", "Bende", "Isiala Ngwa", "Ikwuano", "Osisioma", "Ugwunagbo", "Ukwa"] },
  { state: "Kwara", cities: ["Ilorin", "Offa", "Jebba", "Lafiagi", "Patigi", "Share", "Omu-Aran", "Ajasse-Ipo", "Erin-Ile", "Igbaja"] },
  { state: "Osun", cities: ["Osogbo", "Ile-Ife", "Ilesa", "Ede", "Iwo", "Ejigbo", "Ikire", "Ila-Orangun", "Inisa", "Modakeke"] },
  { state: "Ekiti", cities: ["Ado-Ekiti", "Ikere", "Ijero", "Iyin", "Oye", "Ikole", "Emure", "Efon-Alaaye", "Omuo", "Aramoko"] },
  { state: "Plateau", cities: ["Jos", "Bukuru", "Barkin Ladi", "Pankshin", "Shendam", "Langtang", "Mangu", "Bokkos", "Wase", "Kanke"] },
  { state: "Bayelsa", cities: ["Yenagoa", "Brass", "Sagbama", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Southern Ijaw"] },
];

export function searchLocations(query: string): LocationItem[] {
  if (!query || query.length < 2) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const results: LocationItem[] = [];

  for (const loc of locationData) {
    if (loc.state.toLowerCase().includes(normalizedQuery)) {
      results.push({ state: loc.state, city: loc.cities[0] });
    }
    for (const city of loc.cities) {
      if (city.toLowerCase().includes(normalizedQuery)) {
        results.push({ state: loc.state, city });
      }
    }
  }

  return results.slice(0, 8);
}
