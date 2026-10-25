export interface RentBreakdown {
  selfContained: { min: number; max: number };
  oneBedroom: { min: number; max: number };
  twoBedroom: { min: number; max: number };
  threeBedroomPlus: { min: number; max: number };
}

export interface TransitConnectivity {
  availableModes: string[];
  frequency: "High" | "Moderate" | "Low" | "Very High" | string;
  primaryCorridors: string[];
}

export interface LivingQualityScores {
  traffic: { score: number; label: string; details?: string };
  security: { score: number; label: string; details?: string };
  flood: { score: number; label: string; details?: string };
  cleanliness: { score: number; label: string; details?: string };
  electricity?: { score: number; label: string; hoursPerDay?: number };
  water?: { score: number; label: string };
}

export interface AreaGistData {
  locationKey: string;
  locationName: string;
  state: string;
  lga?: string;
  headline: string;
  summary: string;
  confidenceScore: "High Confidence" | "Moderate Confidence" | "Preliminary / Developing";
  weather: {
    temperature: number;
    condition: string;
    humidity: number;
    wind_speed: number;
    rain_alert: boolean;
    updatedAt: string;
  } | null;
  rentBreakdown?: RentBreakdown;
  transit?: TransitConnectivity;
  scores?: LivingQualityScores;
  rentalReality: Array<{
    dimension: string;
    status: "Favourable" | "Fair" | "Challenging" | "High Alert" | string;
    findings: string;
    renterImplication: string;
    actionableStep: string;
    evidenceLabel: string;
    sources: Array<{ title: string; url: string; date?: string }>;
  }>;
  recentIntelligence: Array<{
    title: string;
    summary: string;
    renterImplication: string;
    category: string;
    sourceLabel: string;
    sourceUrl: string;
    publishedAt: string;
    confidence: string;
  }>;
  checklist: Array<{
    task: string;
    reason: string;
    priority: "critical" | "recommended" | "optional";
  }>;
  stats: {
    totalAvailableListings: number;
    medianRent: number;
    priceRange: { min: number; max: number };
    sampleListings: Array<{
      id: string;
      title: string;
      price: number;
      type: string;
      address: string;
      photos: string[];
    }>;
  };
  communityReports: Array<{
    id: string;
    category: string;
    gist: string;
    streetOrLandmark: string;
    authorName: string;
    occurrenceType: string;
    corroborationsCount: number;
    createdAt: string;
  }>;
  dataCoverage: {
    sourcesCheckedCount: number;
    lastSuccessfulResearchAt: string;
    coverageNote: string;
  };
}

export interface ComparisonData {
  area1: AreaGistData;
  area2: AreaGistData;
  preferences: {
    budget?: number;
    commuteDestination?: string;
  };
  comparisonSummary: {
    verdict: string;
    rentWinner: string;
    availableOptionsWinner: string;
    weatherAlert: string;
  };
}
