export interface Property {
  _id: string;
  title: string;
  description: string;
  type: "rent" | "short-let";
  apartmentType: string;
  state: string;
  lga: string;
  address: string;
  price: number;
  cautionFee?: number;
  serviceFee?: number;
  totalPrice?: number;
  photos: string[];
  videos?: string[];
  amenities: string[];
  houseRules: string[];
  bedrooms: number;
  bathrooms: number;
  toilets: number;
  status: "available" | "booked" | "rented" | "delisted" | "draft";
  host: Host;
  rating?: number;
  reviewCount?: number;
  views?: number;
  createdAt: string;
  updatedAt: string;
  isPromoted?: boolean;
  promotionPackage?: "boost" | "featured" | "spotlight" | null;
}

export interface Host {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  role: "agent" | "landlord";
  isVerified: boolean;
  rating?: number;
  reviewCount?: number;
  listingCount?: number;
}

export interface PropertyReview {
  _id: string;
  property: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SearchFilters {
  state?: string;
  lga?: string;
  type?: "rent" | "short-let";
  apartmentType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  amenities?: string[];
}

export interface Booking {
  _id: string;
  property: Property;
  user: string;
  checkIn?: string;
  checkOut?: string;
  viewingDate?: string;
  totalAmount: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  role: "user" | "agent" | "landlord";
  isVerified: boolean;
  createdAt: string;
}

export interface AgentReport {
  agentPhone: string;
  totalReports: number;
  positiveReports: number;
  negativeReports: number;
  trustScore: number;
  categories: {
    positive: string[];
    negative: string[];
  };
}
