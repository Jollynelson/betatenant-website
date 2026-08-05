export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
] as const;

// Exact values from BT backend/frontend
export const APARTMENT_TYPES = [
  { label: "Single Room / Shared Apartment", value: "single-room/shared-apartment" },
  { label: "Self Contained", value: "self-contained" },
  { label: "Mini Flat / 1 Bedroom", value: "mini-flat/one-bedroom" },
  { label: "2 Bedroom Flat", value: "two-bedroom" },
  { label: "3 Bedroom Flat", value: "three-bedroom" },
  { label: "4 Bedroom Flat", value: "four-bedroom" },
  { label: "Big Family House (4+ Bedrooms)", value: "big-family-house-4plus" },
] as const;

export type ApartmentTypeValue = (typeof APARTMENT_TYPES)[number]["value"];

// Amenity display names → icon mapping (slug keys match BT backend camelCase)
export const AMENITY_ICONS: Record<string, string> = {
  wifi:                         "/icons/amenities/wifi.png",
  airConditioner:               "/icons/amenities/air-conditioner.png",
  airConditioners:              "/icons/amenities/air-conditioner.png",
  swimmingPool:                 "/icons/amenities/swimming-pool.png",
  pool:                         "/icons/amenities/swimming-pool.png",
  generatorHouse:               "/icons/amenities/genhouse.png",
  generatorSpace:               "/icons/amenities/genspace.png",
  generalDieselGenerator:       "/icons/amenities/generator.png",
  dedicatedTransformer:         "/icons/amenities/generator.png",
  dedicatedParkingSpace:        "/icons/amenities/parking_space.png",
  parkingSpace:                 "/icons/amenities/parking_space.png",
  parkingLot:                   "/icons/amenities/parking_space.png",
  securityCamera:               "/icons/amenities/cctv.png",
  cctvSurveillance:             "/icons/amenities/cctv.png",
  elevator:                     "/icons/amenities/elevator.png",
  washingMachine:               "/icons/amenities/washing-machine.png",
  washer:                       "/icons/amenities/washer.png",
  balcony:                      "/icons/amenities/balcony.png",
  kitchen:                      "/icons/amenities/kitchen.png",
  kitchenFittedWithCabinets:    "/icons/amenities/kitchen_cabinet.png",
  fullyEquippedGym:             "/icons/amenities/gym.png",
  inverterBackup:               "/icons/amenities/inverter.png",
  newlyBuilt:                   "/icons/amenities/newbuilding.png",
  "gatedEstate/SecureCommunity":"/icons/amenities/gated.png",
  estate:                       "/icons/amenities/estate.png",
  generalPrepaidMeter:          "/icons/amenities/prepaid.png",
  refrigerator:                 "/icons/amenities/refrigerator.png",
  waterHeater:                  "/icons/amenities/water-voc.png",
  waterTreatmentSystem:         "/icons/amenities/water_treat.png",
  wardrobesInBedrooms:          "/icons/amenities/wardrobe.png",
  television:                   "/icons/amenities/television.png",
  movieStreamingService:        "/icons/amenities/television.png",
  backupPowerSource:            "/icons/amenities/backup.png",
  microwave:                    "/icons/amenities/microwave.png",
  workspace:                    "/icons/amenities/workspace-desk.png",
  landlordResidingInProperty:   "/icons/amenities/landlord.png",
  rooftopTerrace:               "/icons/amenities/roof-light.png",
  hotTub:                       "/icons/amenities/hot-tub.png",
  dryingMachine:                "/icons/amenities/drying-machine.png",
  hairDryer:                    "/icons/amenities/hair-dryer.png",
  dryer:                        "/icons/amenities/hair-dryer.png",
  iron:                         "/icons/amenities/iron.png",
  coffeeMaker:                  "/icons/amenities/coffee_maker.png",
  outdoorDiningGrill:           "/icons/amenities/gril.png",
  grill:                        "/icons/amenities/gril.png",
  dishesAndSilverware:          "/icons/amenities/dish_silverware.png",
  cookerInstalled:              "/icons/amenities/pressure-cooker.png",
  smokeAlarm:                   "/icons/amenities/alarm-smoke.png",
  smokeFireGasAlaram:           "/icons/amenities/alarm-smoke.png",
  cleaningDuringStay:           "/icons/amenities/cleaning.png",
  fullyEquippedGymIcon:         "/icons/amenities/gym.png",
  "24/7SecurityPersonnel":      "/icons/amenities/security-key-usb.png",
  wheelChair:                   "/icons/amenities/wheel_chair.png",
  "gameConsole(ps4/ps5)":       "/icons/amenities/game.png",
  partiesAllowed:               "/icons/amenities/party.png",
  breakfast:                    "/icons/amenities/breakfast.png",
};

// Convert BT amenity slug (hyphen-case) to camelCase key for icon lookup
export function amenitySlugToKey(slug: string): string {
  return slug.split("-").map((part, i) =>
    i === 0 ? part : part[0].toUpperCase() + part.slice(1)
  ).join("");
}

export const PRICE_RANGES = [
  { label: "Under ₦200k/yr", min: 0, max: 200000 },
  { label: "₦200k – ₦500k/yr", min: 200000, max: 500000 },
  { label: "₦500k – ₦1M/yr", min: 500000, max: 1000000 },
  { label: "₦1M – ₦2M/yr", min: 1000000, max: 2000000 },
  { label: "₦2M – ₦5M/yr", min: 2000000, max: 5000000 },
  { label: "Above ₦5M/yr", min: 5000000, max: 999999999 },
] as const;

export const formatPrice = (price: number): string => {
  if (price >= 1000000) return `₦${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `₦${(price / 1000).toFixed(0)}k`;
  return `₦${price.toLocaleString()}`;
};

export const formatPriceFullNumber = (price: number): string => {
  return `₦${price.toLocaleString()}`;
};
