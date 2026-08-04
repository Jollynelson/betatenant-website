export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
] as const;

export const APARTMENT_TYPES = [
  "Single Room",
  "Self Contained",
  "Mini Flat",
  "1 Bedroom",
  "2 Bedroom",
  "3 Bedroom",
  "4 Bedroom",
  "Duplex",
  "Penthouse",
] as const;

export const AMENITIES = [
  "24/7 Electricity",
  "Running Water",
  "Security",
  "Parking Space",
  "Swimming Pool",
  "Gym",
  "WiFi",
  "Air Conditioning",
  "Furnished",
  "Gated Compound",
  "CCTV",
  "Elevator",
  "Balcony",
  "Garden",
  "Laundry",
  "Generator",
  "Solar Power",
  "Smart TV",
  "Kitchen",
  "Dining Area",
] as const;

export const PRICE_RANGES = [
  { label: "Under ₦200k", min: 0, max: 200000 },
  { label: "₦200k - ₦500k", min: 200000, max: 500000 },
  { label: "₦500k - ₦1M", min: 500000, max: 1000000 },
  { label: "₦1M - ₦2M", min: 1000000, max: 2000000 },
  { label: "₦2M - ₦5M", min: 2000000, max: 5000000 },
  { label: "Above ₦5M", min: 5000000, max: Infinity },
] as const;

export const formatPrice = (price: number): string => {
  if (price >= 1000000) {
    return `₦${(price / 1000000).toFixed(1)}M`;
  }
  if (price >= 1000) {
    return `₦${(price / 1000).toFixed(0)}k`;
  }
  return `₦${price.toLocaleString()}`;
};

export const formatPriceFullNumber = (price: number): string => {
  return `₦${price.toLocaleString()}`;
};
