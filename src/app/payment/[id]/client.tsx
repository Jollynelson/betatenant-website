"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, Phone, Home, MapPin } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { api, mapProperty } from "@/lib/api";
import { formatPriceFullNumber } from "@/lib/constants";
import { useAuthStore } from "@/lib/auth-store";

// Rent: inspection fee + BT charge (₦700) = total
const BT_RENT_CHARGE = 700;

function PaymentContent({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const { user } = useAuthStore();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [viewingDate, setViewingDate] = useState("");
  const [isPaying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  // Prefetch user profile for phone
  useEffect(() => {
    api.get<any>("/v1/user/profile")
      .then((r) => {
        const phone: string = String(r?.profile?.phoneNumber ?? r?.userProfile?.phoneNumber ?? "");
        if (phone) setPhoneNumber(phone.startsWith("234") ? "0" + phone.slice(3) : phone);
      })
      .catch(() => {});
  }, []);

  const [rawProperty, setRawProperty] = useState<any>(null);

  useEffect(() => {
    api
      .get<any>(`/v1/user/property/${propertyId}`)
      .then((res) => {
        setProperty(mapProperty(res.property));
        setRawProperty(res.property);
      })
      .catch((err) => setFetchError(err.message || "Failed to load property."))
      .finally(() => setLoading(false));
  }, [propertyId]);

  const viewingFee = rawProperty?.inspectionFee ?? 0;
  const total = viewingFee + BT_RENT_CHARGE;

  const handlePay = async () => {
    setPayError("");
    if (!phoneNumber) return setPayError("Phone number is required.");
    if (!viewingDate) return setPayError("Please select a viewing date.");

    const token = localStorage.getItem("BT_TOKEN");
    if (!token) return setPayError("Please log in to continue.");

    setPaying(true);
    try {
      const payload = {
        propertyId,
        viewingDate,
        phoneNumber,
        amountPaid: total * 100, // in kobo for Paystack
      };

      const res = await api.post<any>("/v1/user/create-order", payload);

      // Redirect to Paystack checkout
      const authUrl: string =
        res?.data?.paystackResponse?.data?.authorization_url ??
        res?.paystackResponse?.data?.authorization_url ??
        "";

      if (!authUrl) throw new Error("Could not retrieve payment link. Please try again.");
      window.location.href = authUrl;
    } catch (err: any) {
      setPayError(err.message || "An unexpected error occurred.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-bt-primary" />
      </div>
    );
  }

  if (fetchError || !property) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-neutral-500">{fetchError || "Property not found."}</p>
        <button onClick={() => router.back()} className="mt-4 text-bt-primary font-medium hover:underline text-sm">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bt-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-6"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-neutral-900 mb-6">Confirm Payment</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Property summary */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
            <h2 className="font-semibold text-neutral-900">Booking Details</h2>

            {property.photos[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={property.photos[0]}
                alt={property.title}
                className="w-full h-44 object-cover rounded-xl"
              />
            )}

            <div>
              <h3 className="font-semibold text-neutral-900">{property.title}</h3>
              <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {property.address}, {property.lga}, {property.state}
              </p>
              <p className="text-bt-primary font-bold mt-2">
                {formatPriceFullNumber(property.price)}/year
              </p>
            </div>

            <div className="border-t border-neutral-100 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-bt-primary/10 flex items-center justify-center">
                  <Home className="w-4 h-4 text-bt-primary" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Hosted by</p>
                  <p className="text-sm font-medium text-neutral-800">
                    {property.host?.firstName} {property.host?.lastName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment form */}
          <div className="space-y-4">
            {/* Price breakdown */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5">
              <h2 className="font-semibold text-neutral-900 mb-4">Price Breakdown</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Viewing fee</span>
                  <span>₦{viewingFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Beta Tenant charge</span>
                  <span>₦{BT_RENT_CHARGE.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-neutral-900 pt-3 border-t border-neutral-100">
                  <span>Total</span>
                  <span>₦{total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Contact & viewing */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
              <h2 className="font-semibold text-neutral-900">Contact Details</h2>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="08012345678"
                    className="w-full border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bt-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Viewing Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="datetime-local"
                    value={viewingDate}
                    onChange={(e) => setViewingDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bt-primary/30"
                  />
                </div>
              </div>

              {payError && (
                <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{payError}</p>
              )}

              <button
                type="button"
                onClick={handlePay}
                disabled={isPaying}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-bt-primary text-white font-semibold text-sm hover:bg-bt-primary-light transition-colors disabled:opacity-60 shadow-[0_2px_8px_rgba(10,8,118,0.25)]"
              >
                {isPaying && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPaying ? "Processing..." : `Pay ₦${total.toLocaleString()}`}
              </button>

              <p className="text-xs text-neutral-400 text-center">
                You will be redirected to Paystack to complete payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = use(params);
  const id = typeof window !== "undefined"
    ? window.location.pathname.split("/payment/")[1]?.split("/")[0] || paramId
    : paramId;
  return (
    <AuthGuard>
      <PaymentContent propertyId={id} />
    </AuthGuard>
  );
}
