// Central API client for the BT backend.
// In development: calls go through the Next.js rewrite (/api/bt → https://api.betatenant.com)
// In production (Cloudflare Workers): calls go directly to the API (rewrites don't work in Workers)

/**
 * Route images through Cloudflare Image Transformations.
 *
 * Images on AWS S3 (betatenant, eu-north-1) are routed through:
 *   https://betatenant.com/cdn-cgi/image/width=N,quality=85,format=auto/{s3-url}
 *
 * Cloudflare fetches the S3 original once, converts to WebP/AVIF, resizes,
 * caches at edge. Activated: betatenant.com zone, S3 origin added.
 *
 * Uses a hardcoded production domain — NOT window.location — so it works
 * correctly during static generation (SSG), SSR, and client rendering.
 */
export function cdnImg(url: string, width = 800): string {
  if (!url || url.startsWith("/") || url.startsWith("data:")) return url;
  if (url.includes("/cdn-cgi/image/")) return url;  // already transformed

  // Legacy Cloudinary URLs — Cloudinary's own transforms
  if (url.includes("res.cloudinary.com")) {
    if (url.includes("/upload/q_auto") || url.includes("/upload/f_auto")) return url;
    return url.replace("/upload/", `/upload/q_auto,f_auto,w_${width}/`);
  }

  // S3 + imagedelivery.net → Cloudflare Image Transformations
  if (url.includes("amazonaws.com") || url.includes("imagedelivery.net")) {
    return `https://betatenant.com/cdn-cgi/image/width=${width},quality=85,format=auto/${url}`;
  }

  return url;
}

/** Smaller thumbnail — for property cards (400px wide) */
export function cdnThumb(url: string): string {
  return cdnImg(url, 400);
}

const BASE =
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://api.betatenant.com"
    : "/api/bt";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("BT_TOKEN");
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("BT_TOKEN");
      localStorage.removeItem("BT_USER");
      if (!window.location.pathname.startsWith("/auth")) {
        window.location.href = "/login";
      }
    }
  }
  if (!res.ok) throw new Error(data.message || data.errorMessage || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>("GET", path, undefined, signal),
  post: <T>(path: string, body: unknown, signal?: AbortSignal) => request<T>("POST", path, body, signal),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string, body?: unknown) => request<T>("DELETE", path, body),
};

// ── Field mapper ──────────────────────────────────────────────────────────────
// The backend returns its own field names; we normalise them to our Property type.
export function mapProperty(raw: any) {
  const host = raw.userId ?? {};
  return {
    _id: String(raw._id),
    title: raw.houseName || `${raw.roomCount ?? 1} Bedroom in ${raw.propertyLGA}`,
    description: raw.houseDescription ?? "",
    type: (raw.rentType ?? "rent") as "rent" | "short-let",
    apartmentType: raw.apartmentType ?? "",
    state: raw.propertyState ?? "",
    lga: raw.propertyLGA ?? "",
    address: raw.streetAddress ?? "",
    price: raw.listingFee ?? 0,
    cautionFee: raw.cautionFee ?? 0,
    photos: Array.isArray(raw.photoURLs) && raw.photoURLs.length > 0
      ? raw.photoURLs.map((u: string, i: number) => i === 0 ? cdnImg(u, 900) : cdnImg(u, 800))
      : ["/placeholder-property.jpg"],
    videos: raw.videoURLs ?? [],
    amenities: Array.isArray(raw.amenities)
      ? raw.amenities.map((a: any) => (typeof a === "string" ? a : a.name))
      : [],
    houseRules: Array.isArray(raw.houseRules)
      ? raw.houseRules.map((r: any) => (typeof r === "string" ? r : r.name))
      : [],
    bedrooms: raw.roomCount ?? 0,
    bathrooms: raw.bathroomCount ?? 0,
    toilets: 0, // backend has no toiletCount field — not used
    status: raw.propertyStatus ?? "available",
    isPromoted: host.userSubscriptionObject?.status === "active",
    isPremium:  host.userSubscriptionObject?.status === "active",
    rating: raw.averageReview ?? undefined,
    reviewCount: raw.totalReviews ?? 0,
    views: raw.totalViews ?? 0,
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
    promotionPackage: raw.promotionPackage ?? null,
    host: {
      _id: String(host._id ?? ""),
      firstName: host.firstName ?? "",
      lastName: host.lastName ?? "",
      email: host.email ?? "",
      phone: host.phoneNumber ?? "",
      avatar: host.profilePic ?? undefined,
      role: (host.role ?? "agent") as "agent" | "landlord",
      isVerified: !!(host.userVerified || host.userVerificationObject?.status === "verified"),
      isPremium:  host.userSubscriptionObject?.status === "active",
      rating: host.agentStats?.averageRating ?? undefined,
      reviewCount: host.agentStats?.totalReviews ?? 0,
      listingCount: host.agentStats?.totalListings ?? 0,
    },
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginResponse {
  token: string;
  userDetails: { email: string; userId: string; fullName: string; role: string };
  successful: boolean;
}

export interface RegisterResponse {
  verificationId: string;
  successful: boolean;
  message: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/v1/auth/login", { email, password }),

  register: (firstName: string, lastName: string, email: string, password: string, role = "user") =>
    api.post<RegisterResponse>("/v1/auth/register", { firstName, lastName, email, password, role }),

  verifyEmail: (verificationId: string, otp: string) =>
    api.post("/v1/auth/verify-email", { verificationId, otp }),
};

// ── Properties ────────────────────────────────────────────────────────────────
export const propertyApi = {
  /** Homepage / listings page — paginated */
  list: async (page = 1, limit = 12) => {
    const res = await api.get<any>(`/v1/user/properties/rent/${page}/${limit}`);
    const docs: any[] = res.properties?.docs ?? res.properties ?? [];
    return {
      properties: docs.map(mapProperty),
      totalDocs: res.properties?.totalDocs ?? docs.length,
      totalPages: res.properties?.totalPages ?? 1,
      page,
    };
  },

  /** Search / filter  */
  search: async (params: {
    state?: string;
    localGovernmentArea?: string;
    apartmentTypes?: string[];
    amenities?: string[];
    minAmount?: number;
    maxAmount?: number;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) => {
    const { page = 1, limit = 12, ...body } = params;
    const res = await api.post<any>(`/v1/user/search-a-property/${page}/${limit}`, {
      ...body,
      rentType: "rent",
    });
    const docs: any[] = res.properties ?? [];
    return {
      properties: docs.map(mapProperty),
      totalResults: res.totalResults ?? docs.length,
      totalPages: res.totalPages ?? 1,
      page,
    };
  },

  /** Property detail */
  get: async (id: string) => {
    const res = await api.get<any>(`/v1/user/property/${id}`);
    return {
      property: mapProperty(res.property),
      similarProperties: (res.similarProperties ?? []).map(mapProperty),
      areYouLoggedIn: res.areYouLoggedIn ?? false,
    };
  },
};
