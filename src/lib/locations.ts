export interface LocationItem {
  state: string;
  city: string;
}

export const locationData = [
  { state: "Abia", cities: ["Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala Ngwa North", "Isiala Ngwa South", "Isiukwuato", "Obi Ngwa", "Ohafia", "Osisioma", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umuahia North", "Umuahia South", "Umunneochi"] },
  { state: "Adamawa", cities: ["Yola North", "Yola South", "Demsa", "Fufore", "Ganye", "Girei", "Gombi", "Guyuk", "Hong", "Jada", "Lamurde", "Madagali", "Maiha", "Mayo-Belwa", "Michika", "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo"] },
  { state: "Akwa Ibom", cities: ["Abak", "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim", "Etim Ekpo", "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono-Ibom", "Ika", "Ikono", "Ikot Ekpene", "Ikot-Abasi", "Ini", "Itu", "Mbo", "Mkpat-Enin", "Nsit-Atai", "Nsit-Ibom", "Nsit-Ubium", "Obot-Akara", "Okobo", "Onna", "Oron", "Oruk Anam", "Udung-Uko", "Ukanafun", "Uruan", "Urue-Offong/Oruko", "Uyo"] },
  { state: "Anambra", cities: ["Awka", "Idemili", "Nnewi", "Onitsha", "Aghamelu", "Aguata", "Anambra East", "Anambra West", "Anaocha", "Ayamelum", "Dunukofia", "Ekwusigo", "Ihiala", "Njikoka", "Ogbaru", "Orumba", "Oyi"] },
  { state: "Bauchi", cities: ["Bauchi LGA", "Bogoro", "Alkaleri", "Damban", "Darazo", "Dass", "Gamawa", "Ganjuwa", "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira", "Toro", "Warji", "Zaki"] },
  { state: "Bayelsa", cities: ["Yenagoa", "Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Sagbama", "Southern Ijaw"] },
  { state: "Benue", cities: ["Gboko", "Katsina-Ala", "Makurdi", "Otukpo", "Ado", "Agatu", "Apa", "Buruku", "Guma", "Gwer", "Konshisha", "Kwande", "Logo", "Obi", "Ogbadibo", "Ohimini", "Oju", "Okpokwu", "Tarka", "Ukum", "Ushongo", "Vandeikya"] },
  { state: "Borno", cities: ["Maiduguri", "Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa", "Dikwa", "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga", "Kala/Balge", "Konduga", "Kukawa", "Kwaya Kusar", "Mafa", "Magumeri", "Marte", "Mobbar", "Monguno", "Ngala", "Nganzai", "Shani"] },
  { state: "Cross River", cities: ["Calabar", "Ikom", "Ogoja", "Abi", "Akamkpa", "Akpabuyo", "Bakassi", "Bekwara", "Biase", "Boki", "Etung", "Obanliku", "Obubra", "Obudu", "Odukpani", "Yakuur", "Yala"] },
  { state: "Delta", cities: ["Oshimili South", "Sapele", "Ugheli", "Uvwie", "Warri", "Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Ethiope East", "Ethiope West", "Ika North East", "Ika South", "Isoko", "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Patani", "Udu", "Ukwuani"] },
  { state: "Ebonyi", cities: ["Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza", "Ikwo", "Ishielu", "Ivo", "Izzi", "Ohaozara", "Ohaukwu", "Onicha"] },
  { state: "Edo", cities: ["Benin City", "Egor", "Ekpoma", "Ikpoba-Okha", "Okada", "Akoko-Edo", "Auchi", "Esan North East", "Fugar", "Igueben", "Irrua", "Orhionmwon", "Ovia South", "Owan", "Ubiaja", "Uhunmwonde"] },
  { state: "Ekiti", cities: ["Ado Ekiti", "Ido-Osi", "Ikere", "Ikole", "Ilawe", "Aiyekire (Gbonyin)", "Aramoko", "Efon", "Emure", "Ijero", "Ilejemeje", "Irepodun/Ifelodun", "Ise/Orun", "Moba", "Omuo", "Oye"] },
  { state: "Enugu", cities: ["Enugu", "Nkanu West", "Nsukka", "Udi", "Aninri", "Awgu", "Ezeagu", "Igbo Eze South", "Igbo-Etiti", "Igbo-Eze North", "Isi-Uzo", "Nkanu East", "Oji-River", "Udenu", "Uzo-Uwani"] },
  { state: "Gombe", cities: ["Gombe LGA", "Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Kaltungo", "Kwami", "Nafada", "Shomgom", "Yamaltu/Deba"] },
  { state: "Imo", cities: ["Ikeduru", "Mbaitoli", "Okigwe", "Orlu", "Owerri", "Aboh-Mbaise", "Ahiazu-Mbaise", "Ehime-Mbano", "Ezinihitte", "Ezinihitte Mbaise", "Ideato North", "Ideato South", "Ihitte/Uboma", "Isiala Mbano", "Isu", "Ngor-Okpala", "Njaba", "Nkwerre", "Nwangele", "Obowo", "Oguta", "Ohaji/Egbema", "Onuimo", "Orsu", "Oru"] },
  { state: "Jigawa", cities: ["Dutse-Jigawa", "Garki", "Auyo", "Babura", "Biriniwa", "Buji", "Gagarawa", "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa", "Kaugama", "Kazaure", "Kiri Kasamma", "Kiyawa", "Maigatari", "Malam Madori", "Miga", "Ringim", "Roni", "Sule-Tankarkar", "Taura", "Yankwashi"] },
  { state: "Kaduna", cities: ["Chikun", "Igabi", "Kaduna / Kaduna State", "Zaria", "Birnin-Gwari", "Giwa", "Ikara", "Jaba", "Jema'a", "Kachia", "Kagarko", "Kajuru", "Kaura-Kaduna", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sanga", "Soba", "Zango-Kataf"] },
  { state: "Kano", cities: ["Fagge", "Kano Municipal", "Nasarawa-Kano", "Tarauni", "Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala", "Dambatta", "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Gabasawa", "Garko", "Garum Mallam", "Garun Mallam", "Gaya", "Gezawa", "Gwale", "Gwarzo", "Kabo", "Karaye", "Kibiya", "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda", "Minjibir", "Rano", "Rimin Gado", "Rogo", "Shanono", "Sumaila", "Takai", "Tofa", "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil"] },
  { state: "Katsina", cities: ["Danja", "Daura", "Katsina", "Zango", "Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dan Musa", "Dandume", "Dutsi", "Dutsin-Ma", "Faskari", "Funtua", "Ingawa", "Jibia", "Kafur", "Kaita", "Kankara", "Kankia", "Kurfi", "Kusada", "Mai'adua", "Malumfashi", "Mani", "Mashi", "Matazu", "Musawa", "Rimi", "Sabuwa", "Safana", "Sandamu"] },
  { state: "Kebbi", cities: ["Birnin Kebbi", "Jega", "Zuru", "Aleiro", "Arewa-Dandi", "Argungu", "Augie", "Bagudo", "Bunza", "Dandi", "Fakai", "Gwandu", "Kalgo", "Koko/Besse", "Maiyama", "Ngaski", "Sakaba", "Shanga", "Suru", "Wasagu/Danko", "Yauri"] },
  { state: "Kogi", cities: ["Lokoja", "Okene", "Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah", "Igala Mela", "Igalamela-Odolu", "Ijumu", "Kabba/Bunu", "Kogi LGA", "Koton Karfe", "Mopa-Muro", "Ofu", "Ogori/Magongo", "Okehi", "Olamaboro", "Omala", "Yagba East", "Yagba West"] },
  { state: "Kwara", cities: ["Ilorin East", "Ilorin South", "Ilorin West", "Asa", "Baruten", "Edu", "Ekiti-Kwara", "Ifelodun-Kwara", "Irepodun-Kwara", "Isin", "Kaiama", "Moro", "Offa", "Oke-Ero", "Oyun", "Pategi"] },
  { state: "Lagos", cities: ["Ajah", "Alimosho", "Ikeja", "Ojo", "Surulere", "Abule Egba", "Agbara-Igbesan", "Agboyi/Ketu", "Agege", "Amuwo-Odofin", "Apapa", "Badagry", "Egbe/Idimu", "Ejigbo", "Eko Atlantic", "Epe", "Gbagada", "Ibeju", "Ifako-Ijaiye", "Ikorodu", "Ikotun/Igando", "Ikoyi", "Ilashe", "Ilupeju", "Ipaja", "Isolo", "Kosofe", "Lagos Island (Eko)", "Lekki", "Magodo", "Maryland", "Mushin", "Ogba", "Ogudu", "Ojodu", "Ojota", "Orile", "Oshodi", "Shomolu", "Tarkwa Bay Island", "Victoria Island", "Yaba"] },
  { state: "Nasarawa", cities: ["Karu-Nasarawa", "Keffi", "Lafia", "Akwanga", "Awe", "Doma", "Keana", "Kokona", "Nasarawa", "Nasarawa-Eggon", "Obi-Nasarawa", "Toto", "Wamba"] },
  { state: "Niger", cities: ["Bida", "Bosso", "Chanchaga", "Minna", "Suleja", "Agaie", "Agwara", "Borgu", "Edati", "Gbako", "Gurara", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga", "Mashegu", "Mokwa", "Muya", "Paikoro", "Rafi", "Rijau", "Shiroro", "Tafa", "Wushishi"] },
  { state: "Ogun", cities: ["Abeokuta South", "Ado-Odo/Ota", "Ijebu Ode", "Obafemi-Owode", "Sagamu", "Abeokuta North", "Ayetoro", "Ewekoro", "Ifo", "Ijebu", "Ikenne", "Ilaro", "Imeko Afon", "Ipokia", "Iseri", "Odeda", "Odogbolu", "Ogun Waterside", "Pakuro", "Remo North"] },
  { state: "Ondo", cities: ["Akure", "Iju/Itaogbolu", "Okitipupa", "Ondo", "Owo", "Akungba", "Ese-Odo", "Idanre", "Ifedore", "Ikare Akoko", "Ilaje", "Ile-Oluji-Okeigbo", "Irele", "Isua", "Odigbo", "Oka", "Okeagbe", "Okeigbo", "Ose"] },
  { state: "Osun", cities: ["Ede", "Ife", "Ilesa", "Olorunda-Osun", "Osogbo", "Aiyedade", "Aiyedire", "Atakumosa East", "Atakumosa West", "Boluwaduro", "Boripe", "Egbedore", "Ifedayo", "Ifelodun-Osun", "Ikirun", "Ila", "Irepodun-Osun", "Irewole", "Isokan", "Iwo", "Obokun", "Ola-Oluwa", "Oriade", "Orolu"] },
  { state: "Oyo", cities: ["Ibadan", "Akinyele", "Egbeda", "Ido", "Oluyole", "Afijio", "Atiba", "Atisbo", "Ayete", "Eruwa", "Igbo Ora", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola", "Lagelu", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa", "Olorunsogo", "Ona-Ara", "Orelope", "Ori Ire", "Oyo", "Saki East", "Saki West", "Surulere-Oyo"] },
  { state: "Plateau", cities: ["Jos", "Barkin Ladi", "Bassa-Plateau", "Bokkos", "Kanam", "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang", "Pankshin", "Quaan Pan", "Riyom", "Shendam", "Wase"] },
  { state: "Rivers", cities: ["Eleme", "Ikwerre", "Obio-Akpor", "Oyigbo", "Port-Harcourt", "Abua/Odual", "Ahoada", "Akuku Toru", "Andoni", "Asari-Toru", "Bonny", "Degema", "Emohua", "Etche", "Gokana", "Khana", "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Tai"] },
  { state: "Sokoto", cities: ["Illela", "Sokoto North", "Sokoto South", "Binji", "Bodinga", "Dange-Shuni", "Gada", "Goronyo", "Gudu LGA", "Gwadabawa", "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari", "Silame", "Tambuwal", "Tangaza", "Tureta", "Wamako", "Wurno", "Yabo"] },
  { state: "Taraba", cities: ["Jalingo", "Takum", "Wukari", "Ardo-Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Karim-Lamido", "Kurmi", "Lau", "Sardauna", "Ussa", "Yorro", "Zing"] },
  { state: "Yobe", cities: ["Damaturu", "Potiskum", "Bade", "Bursari", "Fika", "Fune", "Geidam", "Gujba", "Gulani", "Jakusko", "Karasuwa", "Machina", "Nangere", "Nguru", "Tarmua", "Yunusari", "Yusufari"] },
  { state: "Zamfara", cities: ["Gusau", "Anka", "Bakura", "Birnin Magaji", "Bukkuyum", "Bungudu", "Gummi", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", "Tsafe", "Zurmi"] },
  { state: "Abuja (FCT)", cities: ["Central Business District", "Gwarinpa", "Kubwa", "Wuse", "Wuse 2", "Abaji", "Apo District", "Asokoro", "Bwari", "Dakibiyu", "Dakwo District", "Dei-Dei", "Duboyi", "Durumi", "Dutse-Alhaji", "Gaduwa", "Galadimawa", "Garki 1", "Garki 2", "Gudu", "Guzape District", "Gwagwa", "Gwagwalada", "Idu Industrial", "Jabi", "Jahi", "Jikwoyi", "Jiwa", "Kabusa", "Kado", "Karmo", "Karshi", "Karu", "Katampe", "Kaura", "Kpeyegyi", "Kuchigoro", "Kuje", "Kurudu", "Kwali", "Lokogoma", "Lugbe District", "Mabushi", "Maitama", "Mararaba", "Masaka", "Mbora", "Mpape", "Nyanya", "Okanje", "Orozo", "Pyakasa", "Sabo Gida", "Utako", "Wumba", "Wuye", "Zuba"] },
];

export function searchLocations(query: string): LocationItem[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  const results: LocationItem[] = [];
  for (const loc of locationData) {
    if (loc.state.toLowerCase().includes(q)) {
      results.push({ state: loc.state, city: loc.cities[0] });
    }
    for (const city of loc.cities) {
      if (city.toLowerCase().includes(q)) {
        results.push({ state: loc.state, city });
      }
    }
  }
  return results.slice(0, 8);
}
