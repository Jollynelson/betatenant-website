import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type LocationData = {
  name: string; state: string; lga?: string; city?: string;
  desc: string; priceRange: string;
  selfConPrice?: string; miniFlatPrice?: string;
  twoBedPrice?: string; threeBedPrice?: string;
  altNames?: string[];
};

const LOC: Record<string, LocationData> = {
  // ── Lagos ──────────────────────────────────────────────────────────
  "lagos": { name:"Lagos", state:"Lagos", desc:"Nigeria's commercial capital", priceRange:"₦250k–₦5M/yr", selfConPrice:"₦250k–₦800k", miniFlatPrice:"₦400k–₦1.5M", twoBedPrice:"₦700k–₦3M", threeBedPrice:"₦1.2M–₦5M" },
  "lagos/lekki": { name:"Lekki", state:"Lagos", lga:"Lekki", desc:"upscale Lagos Island suburb", priceRange:"₦700k–₦5M/yr", selfConPrice:"₦700k–₦1.5M", miniFlatPrice:"₦900k–₦2M", twoBedPrice:"₦1.2M–₦3.5M", threeBedPrice:"₦2M–₦5M" },
  "lagos/victoria-island": { name:"Victoria Island", state:"Lagos", lga:"Victoria Island", desc:"Lagos business and luxury district", priceRange:"₦1.5M–₦8M/yr", selfConPrice:"₦1.5M–₦2.5M", miniFlatPrice:"₦2M–₦4M", twoBedPrice:"₦3M–₦6M", threeBedPrice:"₦5M–₦8M" },
  "lagos/ikoyi": { name:"Ikoyi", state:"Lagos", lga:"Ikoyi", desc:"premium residential island, Lagos", priceRange:"₦2M–₦10M/yr", twoBedPrice:"₦3.5M–₦7M", threeBedPrice:"₦6M–₦10M" },
  "lagos/ikeja": { name:"Ikeja", state:"Lagos", lga:"Ikeja", desc:"Lagos State capital, GRA area", priceRange:"₦500k–₦3M/yr", selfConPrice:"₦400k–₦800k", miniFlatPrice:"₦600k–₦1.2M", twoBedPrice:"₦900k–₦2.5M", threeBedPrice:"₦1.5M–₦3M" },
  "lagos/yaba": { name:"Yaba", state:"Lagos", lga:"Yaba", desc:"tech hub, Lagos Mainland", priceRange:"₦350k–₦2M/yr", selfConPrice:"₦300k–₦650k", miniFlatPrice:"₦450k–₦1M", twoBedPrice:"₦700k–₦1.8M", threeBedPrice:"₦1.2M–₦2.5M", altNames:["Yaba Lagos"] },
  "lagos/surulere": { name:"Surulere", state:"Lagos", lga:"Surulere", desc:"established mid-range Lagos Mainland", priceRange:"₦300k–₦2M/yr", selfConPrice:"₦280k–₦600k", miniFlatPrice:"₦400k–₦900k", twoBedPrice:"₦650k–₦1.8M", threeBedPrice:"₦1M–₦2.5M" },
  "lagos/ajah": { name:"Ajah", state:"Lagos", lga:"Ajah", desc:"growing Lagos Island suburb off Lekki-Epe Expressway", priceRange:"₦450k–₦3M/yr", selfConPrice:"₦400k–₦900k", miniFlatPrice:"₦600k–₦1.2M", twoBedPrice:"₦900k–₦2.5M", threeBedPrice:"₦1.5M–₦3.5M" },
  "lagos/gbagada": { name:"Gbagada", state:"Lagos", lga:"Gbagada", desc:"popular residential Lagos Mainland estate", priceRange:"₦400k–₦2.5M/yr", selfConPrice:"₦350k–₦700k", miniFlatPrice:"₦500k–₦1M", twoBedPrice:"₦800k–₦2M", threeBedPrice:"₦1.3M–₦3M" },
  "lagos/magodo": { name:"Magodo", state:"Lagos", lga:"Magodo", desc:"quiet gated estate area, Lagos Mainland", priceRange:"₦500k–₦3M/yr", selfConPrice:"₦450k–₦800k", miniFlatPrice:"₦600k–₦1.2M", twoBedPrice:"₦900k–₦2.5M", threeBedPrice:"₦1.5M–₦3.5M" },
  "lagos/ogba": { name:"Ogba", state:"Lagos", lga:"Ogba", desc:"affordable residential area, Lagos Mainland", priceRange:"₦300k–₦1.8M/yr", selfConPrice:"₦280k–₦550k", miniFlatPrice:"₦400k–₦800k", twoBedPrice:"₦600k–₦1.5M", threeBedPrice:"₦1M–₦2M" },
  "lagos/maryland": { name:"Maryland", state:"Lagos", lga:"Maryland", desc:"central Lagos near Ikeja", priceRange:"₦350k–₦2M/yr", selfConPrice:"₦300k–₦650k", miniFlatPrice:"₦450k–₦900k", twoBedPrice:"₦700k–₦1.8M", threeBedPrice:"₦1.2M–₦2.5M" },
  "lagos/isolo": { name:"Isolo", state:"Lagos", lga:"Isolo", desc:"affordable Lagos Mainland area", priceRange:"₦200k–₦1.2M/yr", selfConPrice:"₦180k–₦400k", miniFlatPrice:"₦300k–₦600k", twoBedPrice:"₦500k–₦1M" },
  "lagos/mushin": { name:"Mushin", state:"Lagos", lga:"Mushin", desc:"affordable high-density Lagos Mainland", priceRange:"₦180k–₦900k/yr", selfConPrice:"₦150k–₦350k", miniFlatPrice:"₦250k–₦500k", twoBedPrice:"₦400k–₦800k" },
  "lagos/ketu": { name:"Ketu", state:"Lagos", lga:"Agboyi/Ketu", desc:"Lagos Mainland near Mile 12", priceRange:"₦220k–₦1.2M/yr", selfConPrice:"₦200k–₦400k", miniFlatPrice:"₦300k–₦600k", twoBedPrice:"₦500k–₦1M" },
  "lagos/ojodu-berger": { name:"Ojodu Berger", state:"Lagos", lga:"Ojodu", desc:"Lagos Mainland commuter area", priceRange:"₦250k–₦1.5M/yr", selfConPrice:"₦220k–₦450k", miniFlatPrice:"₦350k–₦700k", twoBedPrice:"₦550k–₦1.2M" },
  "lagos/festac": { name:"Festac Town", state:"Lagos", lga:"Amuwo-Odofin", desc:"planned estate, Lagos Mainland", priceRange:"₦300k–₦1.8M/yr", selfConPrice:"₦280k–₦550k", miniFlatPrice:"₦400k–₦800k", twoBedPrice:"₦650k–₦1.5M" },
  "lagos/ikorodu": { name:"Ikorodu", state:"Lagos", lga:"Ikorodu", desc:"affordable outskirts of Lagos", priceRange:"₦150k–₦900k/yr", selfConPrice:"₦130k–₦300k", miniFlatPrice:"₦220k–₦450k", twoBedPrice:"₦350k–₦700k" },
  "lagos/shomolu": { name:"Shomolu", state:"Lagos", lga:"Shomolu", desc:"Lagos Mainland residential area", priceRange:"₦200k–₦1M/yr", selfConPrice:"₦180k–₦380k", miniFlatPrice:"₦280k–₦550k", twoBedPrice:"₦450k–₦900k" },
  "lagos/ojota": { name:"Ojota", state:"Lagos", lga:"Kosofe", desc:"Lagos Mainland near Maryland", priceRange:"₦230k–₦1.2M/yr", selfConPrice:"₦200k–₦420k", miniFlatPrice:"₦320k–₦640k", twoBedPrice:"₦520k–₦1.1M" },
  "lagos/agege": { name:"Agege", state:"Lagos", lga:"Agege", desc:"affordable Lagos Mainland suburb", priceRange:"₦180k–₦900k/yr", selfConPrice:"₦160k–₦320k", miniFlatPrice:"₦250k–₦500k", twoBedPrice:"₦400k–₦800k" },
  "lagos/apapa": { name:"Apapa", state:"Lagos", lga:"Apapa", desc:"Lagos port area", priceRange:"₦350k–₦2M/yr", selfConPrice:"₦300k–₦600k", miniFlatPrice:"₦450k–₦900k", twoBedPrice:"₦700k–₦1.8M" },

  // ── Abuja ──────────────────────────────────────────────────────────
  "abuja": { name:"Abuja", state:"Abuja (FCT)", desc:"Nigeria's federal capital territory", priceRange:"₦350k–₦5M/yr", selfConPrice:"₦300k–₦800k", miniFlatPrice:"₦500k–₦1.5M", twoBedPrice:"₦800k–₦3M", threeBedPrice:"₦1.5M–₦5M" },
  "abuja/maitama": { name:"Maitama", state:"Abuja (FCT)", lga:"Maitama", desc:"most upscale Abuja district", priceRange:"₦1.5M–₦8M/yr", selfConPrice:"₦1.2M–₦2.5M", twoBedPrice:"₦2.5M–₦5M", threeBedPrice:"₦4M–₦8M" },
  "abuja/wuse": { name:"Wuse", state:"Abuja (FCT)", lga:"Wuse", desc:"central Abuja commercial area", priceRange:"₦600k–₦3.5M/yr", selfConPrice:"₦500k–₦1M", miniFlatPrice:"₦700k–₦1.5M", twoBedPrice:"₦1.2M–₦3M" },
  "abuja/wuse-2": { name:"Wuse 2", state:"Abuja (FCT)", lga:"Wuse 2", desc:"upscale Abuja commercial and residential", priceRange:"₦1M–₦5M/yr", selfConPrice:"₦800k–₦1.5M", miniFlatPrice:"₦1.2M–₦2M", twoBedPrice:"₦2M–₦4M", threeBedPrice:"₦3.5M–₦6M" },
  "abuja/asokoro": { name:"Asokoro", state:"Abuja (FCT)", lga:"Asokoro", desc:"diplomatic zone, premium Abuja district", priceRange:"₦2M–₦8M/yr", twoBedPrice:"₦3M–₦6M", threeBedPrice:"₦5M–₦8M" },
  "abuja/garki": { name:"Garki", state:"Abuja (FCT)", lga:"Garki", desc:"established Abuja district near city centre", priceRange:"₦700k–₦3.5M/yr", selfConPrice:"₦600k–₦1M", miniFlatPrice:"₦900k–₦1.8M", twoBedPrice:"₦1.5M–₦3M" },
  "abuja/jabi": { name:"Jabi", state:"Abuja (FCT)", lga:"Jabi", desc:"mid-range Abuja near Jabi Lake Mall", priceRange:"₦700k–₦3.5M/yr", selfConPrice:"₦600k–₦1M", miniFlatPrice:"₦850k–₦1.8M", twoBedPrice:"₦1.4M–₦3M" },
  "abuja/katampe": { name:"Katampe", state:"Abuja (FCT)", lga:"Katampe", desc:"residential Abuja near Maitama", priceRange:"₦800k–₦4M/yr", selfConPrice:"₦700k–₦1.2M", miniFlatPrice:"₦1M–₦2M", twoBedPrice:"₦1.8M–₦3.5M" },
  "abuja/gwarinpa": { name:"Gwarinpa", state:"Abuja (FCT)", lga:"Gwarinpa", desc:"West Africa's largest housing estate", priceRange:"₦400k–₦2.5M/yr", selfConPrice:"₦350k–₦700k", miniFlatPrice:"₦550k–₦1.2M", twoBedPrice:"₦900k–₦2M", threeBedPrice:"₦1.5M–₦3M" },
  "abuja/kubwa": { name:"Kubwa", state:"Abuja (FCT)", lga:"Bwari", desc:"affordable large Abuja satellite town", priceRange:"₦250k–₦1.5M/yr", selfConPrice:"₦200k–₦450k", miniFlatPrice:"₦350k–₦700k", twoBedPrice:"₦600k–₦1.2M" },
  "abuja/lugbe": { name:"Lugbe", state:"Abuja (FCT)", lga:"Lugbe", desc:"affordable Abuja suburb near airport", priceRange:"₦200k–₦1.2M/yr", selfConPrice:"₦180k–₦380k", miniFlatPrice:"₦300k–₦600k", twoBedPrice:"₦500k–₦1M" },
  "abuja/gudu": { name:"Gudu", state:"Abuja (FCT)", lga:"Gudu", desc:"quiet mid-range Abuja suburb", priceRange:"₦450k–₦2.5M/yr", selfConPrice:"₦400k–₦750k", miniFlatPrice:"₦600k–₦1.2M", twoBedPrice:"₦1M–₦2.2M" },
  "abuja/apo": { name:"Apo", state:"Abuja (FCT)", lga:"Apo District", desc:"residential Abuja with good access", priceRange:"₦400k–₦2M/yr", selfConPrice:"₦350k–₦700k", miniFlatPrice:"₦550k–₦1.1M", twoBedPrice:"₦900k–₦1.8M" },
  "abuja/lokogoma": { name:"Lokogoma", state:"Abuja (FCT)", lga:"Lokogoma", desc:"affordable planned Abuja residential", priceRange:"₦250k–₦1.5M/yr", selfConPrice:"₦220k–₦450k", miniFlatPrice:"₦380k–₦750k", twoBedPrice:"₦650k–₦1.3M" },

  // ── Port Harcourt ───────────────────────────────────────────────────
  "port-harcourt": { name:"Port Harcourt", state:"Rivers", desc:"oil city, Rivers State capital", priceRange:"₦250k–₦3M/yr", selfConPrice:"₦220k–₦600k", miniFlatPrice:"₦380k–₦1M", twoBedPrice:"₦650k–₦2M", threeBedPrice:"₦1.2M–₦3.5M" },
  "port-harcourt/gra": { name:"GRA Port Harcourt", state:"Rivers", lga:"GRA", city:"Port Harcourt", desc:"premium Government Residential Area", priceRange:"₦800k–₦5M/yr", twoBedPrice:"₦1.5M–₦3.5M", threeBedPrice:"₦2.5M–₦5M" },
  "port-harcourt/rumuola": { name:"Rumuola", state:"Rivers", lga:"Rumuola", city:"Port Harcourt", desc:"mid-range Port Harcourt residential", priceRange:"₦300k–₦1.8M/yr", selfConPrice:"₦280k–₦550k", twoBedPrice:"₦700k–₦1.5M" },
  "port-harcourt/rumuibekwe": { name:"Rumuibekwe", state:"Rivers", lga:"Rumuibekwe", city:"Port Harcourt", desc:"growing Port Harcourt residential area", priceRange:"₦280k–₦1.5M/yr", selfConPrice:"₦250k–₦500k", twoBedPrice:"₦650k–₦1.4M" },
  "port-harcourt/woji": { name:"Woji", state:"Rivers", lga:"Woji", city:"Port Harcourt", desc:"upscale Port Harcourt suburb", priceRange:"₦500k–₦3M/yr", selfConPrice:"₦450k–₦900k", twoBedPrice:"₦1.2M–₦2.5M" },
  "port-harcourt/eliozu": { name:"Eliozu", state:"Rivers", lga:"Eliozu", city:"Port Harcourt", desc:"affordable Port Harcourt residential", priceRange:"₦200k–₦1.2M/yr", selfConPrice:"₦180k–₦400k", twoBedPrice:"₦550k–₦1.1M" },
  "port-harcourt/rukpokwu": { name:"Rukpokwu", state:"Rivers", lga:"Rukpokwu", city:"Port Harcourt", desc:"Port Harcourt satellite town", priceRange:"₦180k–₦1M/yr", selfConPrice:"₦160k–₦350k", twoBedPrice:"₦450k–₦900k" },
  "port-harcourt/diobu": { name:"Diobu", state:"Rivers", lga:"Diobu", city:"Port Harcourt", desc:"high-density affordable Port Harcourt area", priceRange:"₦150k–₦800k/yr", selfConPrice:"₦130k–₦300k", twoBedPrice:"₦380k–₦750k" },
  "port-harcourt/ada-george": { name:"Ada George", state:"Rivers", lga:"Obio-Akpor", city:"Port Harcourt", desc:"popular Port Harcourt residential area", priceRange:"₦250k–₦1.5M/yr", selfConPrice:"₦220k–₦480k", twoBedPrice:"₦600k–₦1.3M" },
  "port-harcourt/trans-amadi": { name:"Trans Amadi", state:"Rivers", lga:"Port Harcourt", city:"Port Harcourt", desc:"Port Harcourt industrial and residential", priceRange:"₦300k–₦2M/yr", selfConPrice:"₦250k–₦550k", twoBedPrice:"₦700k–₦1.8M" },

  // ── Akwa Ibom ───────────────────────────────────────────────────────
  "akwa-ibom": { name:"Akwa Ibom", state:"Akwa Ibom", desc:"oil-rich south-south Nigeria state", priceRange:"₦150k–₦1.5M/yr", selfConPrice:"₦130k–₦350k", miniFlatPrice:"₦220k–₦600k", twoBedPrice:"₦400k–₦1.2M" },
  "uyo": { name:"Uyo", state:"Akwa Ibom", lga:"Uyo", desc:"Akwa Ibom State capital", priceRange:"₦180k–₦1.5M/yr", selfConPrice:"₦150k–₦380k", miniFlatPrice:"₦250k–₦650k", twoBedPrice:"₦450k–₦1.3M", threeBedPrice:"₦800k–₦2M" },
  "eket": { name:"Eket", state:"Akwa Ibom", lga:"Eket", desc:"oil city in Akwa Ibom State", priceRange:"₦150k–₦1M/yr", selfConPrice:"₦130k–₦300k", twoBedPrice:"₦400k–₦900k" },

  // ── Ibadan ─────────────────────────────────────────────────────────
  "ibadan": { name:"Ibadan", state:"Oyo", desc:"Oyo State capital, Nigeria's largest city by area", priceRange:"₦120k–₦1.5M/yr", selfConPrice:"₦100k–₦300k", miniFlatPrice:"₦180k–₦500k", twoBedPrice:"₦350k–₦1M", threeBedPrice:"₦600k–₦1.8M" },
  "ibadan/bodija": { name:"Bodija Ibadan", state:"Oyo", lga:"Ibadan North", city:"Ibadan", desc:"upscale Ibadan residential estate", priceRange:"₦300k–₦2M/yr", selfConPrice:"₦250k–₦550k", twoBedPrice:"₦600k–₦1.5M" },
  "ibadan/ui": { name:"UI Area Ibadan", state:"Oyo", lga:"Ibadan North", city:"Ibadan", desc:"University of Ibadan environs", priceRange:"₦150k–₦1M/yr", selfConPrice:"₦120k–₦280k", twoBedPrice:"₦380k–₦900k" },

  // ── Enugu ──────────────────────────────────────────────────────────
  "enugu": { name:"Enugu", state:"Enugu", desc:"Coal City, Southeast Nigeria capital", priceRange:"₦130k–₦1.5M/yr", selfConPrice:"₦120k–₦320k", miniFlatPrice:"₦200k–₦550k", twoBedPrice:"₦380k–₦1.2M", threeBedPrice:"₦700k–₦2M" },
  "enugu/independence-layout": { name:"Independence Layout Enugu", state:"Enugu", lga:"Enugu North", city:"Enugu", desc:"upscale Enugu estate", priceRange:"₦300k–₦2M/yr", twoBedPrice:"₦600k–₦1.5M" },
  "enugu/gra": { name:"GRA Enugu", state:"Enugu", lga:"Enugu East", city:"Enugu", desc:"Government Residential Area Enugu", priceRange:"₦400k–₦2.5M/yr", twoBedPrice:"₦800k–₦2M" },
  "enugu/trans-ekulu": { name:"Trans Ekulu Enugu", state:"Enugu", lga:"Enugu East", city:"Enugu", desc:"large planned Enugu housing estate", priceRange:"₦200k–₦1.2M/yr", selfConPrice:"₦180k–₦380k", twoBedPrice:"₦450k–₦1M" },

  // ── Benin City ─────────────────────────────────────────────────────
  "benin-city": { name:"Benin City", state:"Edo", desc:"ancient Edo State capital, cultural hub", priceRange:"₦150k–₦1.5M/yr", selfConPrice:"₦130k–₦350k", miniFlatPrice:"₦220k–₦600k", twoBedPrice:"₦400k–₦1.2M", threeBedPrice:"₦700k–₦2M" },
  "benin-city/gra": { name:"GRA Benin City", state:"Edo", lga:"Egor", city:"Benin City", desc:"upscale Government Residential Area Benin", priceRange:"₦400k–₦3M/yr", twoBedPrice:"₦800k–₦2M" },

  // ── Warri & Delta ─────────────────────────────────────────────────
  "warri": { name:"Warri", state:"Delta", lga:"Warri", desc:"major oil city in Delta State", priceRange:"₦180k–₦2M/yr", selfConPrice:"₦150k–₦400k", miniFlatPrice:"₦280k–₦700k", twoBedPrice:"₦500k–₦1.5M", threeBedPrice:"₦900k–₦2.5M" },
  "effurun": { name:"Effurun", state:"Delta", lga:"Uvwie", desc:"Warri satellite town, Delta State", priceRange:"₦150k–₦1.5M/yr", selfConPrice:"₦130k–₦320k", twoBedPrice:"₦450k–₦1.2M" },
  "asaba": { name:"Asaba", state:"Delta", desc:"Delta State capital on the Niger River", priceRange:"₦150k–₦1.5M/yr", selfConPrice:"₦130k–₦350k", twoBedPrice:"₦420k–₦1.2M" },

  // ── Other cities ────────────────────────────────────────────────────
  "aba": { name:"Aba", state:"Abia", desc:"commercial hub in Abia State", priceRange:"₦120k–₦1.2M/yr", selfConPrice:"₦100k–₦280k", twoBedPrice:"₦350k–₦900k" },
  "owerri": { name:"Owerri", state:"Imo", desc:"Imo State capital", priceRange:"₦150k–₦1.5M/yr", selfConPrice:"₦130k–₦320k", twoBedPrice:"₦400k–₦1.2M" },
  "kano": { name:"Kano", state:"Kano", desc:"Nigeria's second-largest city, northern commercial hub", priceRange:"₦100k–₦1.2M/yr", selfConPrice:"₦80k–₦250k", twoBedPrice:"₦300k–₦900k" },
  "kaduna": { name:"Kaduna", state:"Kaduna", desc:"Kaduna State capital, North-West Nigeria", priceRange:"₦100k–₦1.2M/yr", selfConPrice:"₦80k–₦250k", twoBedPrice:"₦300k–₦900k" },
  "jos": { name:"Jos", state:"Plateau", desc:"Plateau State capital, Nigeria's hill city", priceRange:"₦100k–₦1M/yr", selfConPrice:"₦80k–₦220k", twoBedPrice:"₦280k–₦800k" },
  "calabar": { name:"Calabar", state:"Cross River", desc:"Cross River State capital, tourism hub", priceRange:"₦130k–₦1.2M/yr", selfConPrice:"₦110k–₦300k", twoBedPrice:"₦350k–₦1M" },
  "abeokuta": { name:"Abeokuta", state:"Ogun", desc:"Ogun State capital", priceRange:"₦100k–₦1M/yr", selfConPrice:"₦80k–₦220k", twoBedPrice:"₦280k–₦800k" },
  "ilorin": { name:"Ilorin", state:"Kwara", desc:"Kwara State capital", priceRange:"₦100k–₦1M/yr", selfConPrice:"₦80k–₦220k", twoBedPrice:"₦280k–₦800k" },
  "umuahia": { name:"Umuahia", state:"Abia", desc:"Abia State capital", priceRange:"₦100k–₦900k/yr", selfConPrice:"₦80k–₦220k", twoBedPrice:"₦280k–₦750k" },
};

export function generateStaticParams() {
  return Object.keys(LOC).map((slug) => ({ location: slug.split("/") }));
}

export async function generateMetadata({ params }: { params: Promise<{ location: string[] }> }): Promise<Metadata> {
  const { location: segments } = await params;
  const slug = segments.join("/");
  const loc = LOC[slug];
  if (!loc) return { title: "Properties for Rent | Beta Tenant" };

  const name = loc.name;
  const title = `Flats & Houses to Let in ${name} | Verified Agents | Beta Tenant`;
  const descParts = [`Find verified flats, self-contains, and houses for rent in ${name} — ${loc.desc}.`];
  if (loc.selfConPrice) descParts.push(`Self-contain from ${loc.selfConPrice}.`);
  if (loc.twoBedPrice) descParts.push(`2-bedroom from ${loc.twoBedPrice}.`);
  descParts.push("Verified agents, real reviews.");

  const keywords = [
    `flats for rent ${name}`, `houses to let ${name}`, `house for rent ${name}`,
    `self contain ${name}`, `self con ${name}`, `self contained ${name}`,
    `mini flat ${name}`, `one bedroom flat ${name}`,
    `2 bedroom flat ${name}`, `2 bed flat ${name}`,
    `3 bedroom flat ${name}`, `flat to let ${name}`, `flat for rent ${name}`,
    `apartment for rent ${name}`, `house to rent ${name}`,
    `shortlet ${name}`, `short let ${name}`, `cheap flats ${name}`,
    `affordable flat ${name}`, `verified rental agents ${name}`,
    ...(loc.altNames || []).map(a => `flat for rent ${a}`),
  ];

  return {
    title,
    description: descParts.join(" "),
    keywords,
    openGraph: { title, description: descParts.join(" "), url: `https://betatenant.com/properties/${slug}` },
    alternates: { canonical: `https://betatenant.com/properties/${slug}` },
  };
}

export default async function LocationPage({ params }: { params: Promise<{ location: string[] }> }) {
  const { location: segments } = await params;
  const slug = segments.join("/");
  const loc = LOC[slug];

  if (!loc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6">
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">Location not found</h1>
          <Link href="/properties" className="text-bt-primary font-semibold">Browse all properties →</Link>
        </div>
      </div>
    );
  }

  const searchUrl = `/properties?state=${encodeURIComponent(loc.state)}${loc.lga ? `&lga=${encodeURIComponent(loc.lga)}` : ""}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://betatenant.com" },
      { "@type": "ListItem", "position": 2, "name": "Properties", "item": "https://betatenant.com/properties" },
      ...(segments.length > 1
        ? [{ "@type": "ListItem", "position": 3, "name": segments[0].charAt(0).toUpperCase() + segments[0].slice(1).replace(/-/g," "), "item": `https://betatenant.com/properties/${segments[0]}` },
           { "@type": "ListItem", "position": 4, "name": loc.name, "item": `https://betatenant.com/properties/${slug}` }]
        : [{ "@type": "ListItem", "position": 3, "name": loc.name, "item": `https://betatenant.com/properties/${slug}` }]
      ),
    ],
  };

  return (
    <>
    <Script id={`breadcrumb-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-bt-primary to-[#12127a] text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-white/60 text-sm font-medium uppercase tracking-wider mb-2">Beta Tenant · Verified Rentals</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Flats &amp; Houses to Let in {loc.name}</h1>
          <p className="text-white/70 text-base mb-2">{loc.desc}. Prices from {loc.priceRange}.</p>
          {loc.selfConPrice && (
            <p className="text-white/60 text-sm mb-6">
              Self-contain: {loc.selfConPrice}
              {loc.miniFlatPrice && <> &nbsp;·&nbsp; Mini flat: {loc.miniFlatPrice}</>}
              {loc.twoBedPrice && <> &nbsp;·&nbsp; 2-bed: {loc.twoBedPrice}</>}
            </p>
          )}
          <Link href={searchUrl}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-bt-primary font-bold text-base hover:bg-neutral-100 transition-colors active:scale-[0.97]">
            Browse {loc.name} Listings <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-10">
        {/* Price table */}
        {(loc.selfConPrice || loc.twoBedPrice) && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 mb-8">
            <h2 className="text-base font-bold text-neutral-900 mb-3">Rent Prices in {loc.name} (2025)</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {loc.selfConPrice && <PriceCell label="Self Contain" val={loc.selfConPrice} />}
              {loc.miniFlatPrice && <PriceCell label="Mini Flat" val={loc.miniFlatPrice} />}
              {loc.twoBedPrice && <PriceCell label="2 Bedroom" val={loc.twoBedPrice} />}
              {loc.threeBedPrice && <PriceCell label="3 Bedroom" val={loc.threeBedPrice} />}
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-neutral-900 mb-3">Renting in {loc.name}</h2>
        <p className="text-neutral-600 leading-relaxed mb-4">
          {loc.name} is {loc.desc}. Whether you are looking for a self-contain (self-con), mini flat,
          2-bedroom or 3-bedroom flat, Beta Tenant lists verified properties from vetted agents and
          landlords across {loc.name}. All agents have public profiles with real tenant reviews and
          response time ratings so you can choose with confidence.
        </p>
        <p className="text-neutral-600 leading-relaxed mb-6">
          Typical rent prices in {loc.name} range from {loc.priceRange} per year depending on
          property type, area, and furnishing. Payment is usually annual upfront, plus a refundable
          caution fee (1 month&apos;s rent) and a one-time agency fee (10% of annual rent).
        </p>

        <h3 className="text-base font-bold text-neutral-900 mb-2">Property Types in {loc.name}</h3>
        <ul className="list-disc list-inside text-neutral-600 space-y-1 text-sm mb-6">
          <li><strong>Self-contain / self-con:</strong> Studio with private bathroom and kitchen. Most affordable.</li>
          <li><strong>Mini flat (1 bedroom):</strong> Separate bedroom, living room, kitchen and bathroom.</li>
          <li><strong>2-bedroom flat:</strong> Two bedrooms, sitting room, kitchen. Most popular family option.</li>
          <li><strong>3-bedroom flat:</strong> Full family flat, often in gated estates.</li>
          <li><strong>Shortlet:</strong> Furnished apartment available daily, weekly or monthly.</li>
          <li><strong>Boys quarter (BQ):</strong> Small unit within a compound.</li>
        </ul>

        <h3 className="text-base font-bold text-neutral-900 mb-2">Find a Verified Agent in {loc.name}</h3>
        <p className="text-neutral-600 text-sm leading-relaxed mb-8">
          Every agent on Beta Tenant in {loc.name} has a verified profile with ID confirmation, tenant
          reviews, and response time ratings. View their active listings, read reviews from previous
          tenants, and contact them — without paying an inspection fee first. Suspicious agents can be
          reported directly through the platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href={searchUrl}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-bt-primary text-white font-semibold hover:bg-bt-primary-light transition-colors">
            Browse {loc.name} Properties <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/renting-guide"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-neutral-200 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors">
            Nigeria Renting Guide
          </Link>
        </div>
      </section>
    </div>
    </>
  );
}

function PriceCell({ label, val }: { label: string; val: string }) {
  return (
    <div className="bg-white border border-neutral-100 rounded-xl p-3 text-center">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-neutral-900">{val}</p>
      <p className="text-[10px] text-neutral-400">per year</p>
    </div>
  );
}
