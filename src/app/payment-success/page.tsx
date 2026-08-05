"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, MapPin, Calendar, User, Home } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { api } from "@/lib/api";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingCode = searchParams.get("bookingCode");

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (bookingCode) {
      localStorage.setItem("BT_BookingCode", bookingCode);
    }
  }, [bookingCode]);

  const fetchBooking = async () => {
    if (!bookingCode) return setError("No booking code found.");
    setLoading(true);
    setError("");
    try {
      const data = await api.get<any>(`/v1/user/view-booking/${bookingCode}`);
      setBooking(data);
      setShowDetails(true);
    } catch (err: any) {
      setError(err.message || "Failed to fetch booking details.");
    } finally {
      setLoading(false);
    }
  };

  const bookingDetails = booking?.bookingDetails;
  const property = bookingDetails?.property;
  const host = bookingDetails?.propertyHostDetails;
  const isRent = property?.rentType === "rent";

  return (
    <div className="min-h-screen bg-bt-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Success card */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Payment Successful!</h1>
          <p className="text-neutral-500 text-sm mb-6">
            Your payment was processed. Check your booking details below.
          </p>

          {bookingCode && (
            <div className="bg-neutral-50 rounded-xl px-4 py-3 mb-6 text-left">
              <p className="text-xs text-neutral-400 mb-1 uppercase tracking-wide">Booking Code</p>
              <p className="font-mono font-bold text-neutral-900 uppercase">{bookingCode}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={fetchBooking}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-bt-primary text-white font-semibold text-sm hover:bg-bt-primary-light transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Loading..." : "View Booking Details"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full px-6 py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Go Home
            </button>
          </div>

          {error && (
            <p className="mt-4 text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
          )}
        </div>

        {/* Booking details card */}
        {showDetails && bookingDetails && (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 mt-4">
            <h2 className="font-bold text-neutral-900 mb-4 text-lg">Reservation Details</h2>

            {/* Property image + info */}
            {property && (
              <div className="flex gap-4 mb-5">
                {property.photoURLs?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={property.photoURLs[0]}
                    alt="Property"
                    className="w-20 h-16 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-20 h-16 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                    <Home className="w-6 h-6 text-neutral-300" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-neutral-900 text-sm">
                    {property.roomCount} bedroom apartment
                  </p>
                  <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {property.propertyLGA}, {property.propertyState}
                  </p>
                  <p className="text-sm font-bold text-bt-primary mt-1">
                    ₦{Number(property.listingFee ?? 0).toLocaleString()}
                    {isRent ? "/year" : "/night"}
                  </p>
                </div>
              </div>
            )}

            {/* Date info */}
            <div className="flex items-center gap-2 text-sm text-neutral-700 mb-3">
              <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
              {isRent ? (
                <span>
                  Viewing: <strong>{bookingDetails.viewingDate
                    ? new Date(bookingDetails.viewingDate).toLocaleDateString("en-NG", { dateStyle: "medium" })
                    : "N/A"}</strong>
                </span>
              ) : (
                <span>
                  Check-in: <strong>{bookingDetails.checkInDate
                    ? new Date(bookingDetails.checkInDate).toLocaleDateString("en-NG", { dateStyle: "medium" })
                    : "N/A"}</strong>
                  {" → "}
                  Check-out: <strong>{bookingDetails.checkOutDate
                    ? new Date(bookingDetails.checkOutDate).toLocaleDateString("en-NG", { dateStyle: "medium" })
                    : "N/A"}</strong>
                </span>
              )}
            </div>

            {/* Price breakdown */}
            <div className="bg-neutral-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
              {isRent ? (
                <>
                  <div className="flex justify-between text-neutral-600">
                    <span>Viewing fee</span>
                    <span>₦{Number(property?.inspectionFee ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>BetaTenant charge</span>
                    <span>₦{Number(bookingDetails.betaTenantGets ?? 0).toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-neutral-600">
                    <span>Nightly rate × nights</span>
                    <span>₦{Number(property?.listingFee ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Cleaning fee</span>
                    <span>₦{Number(property?.cleaningFee ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Caution fee</span>
                    <span>₦{Number(property?.cautionFee ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>BetaTenant charge</span>
                    <span>₦{Number(bookingDetails.betaTenantGets ?? 0).toLocaleString()}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-semibold text-neutral-900 pt-2 border-t border-neutral-200">
                <span>Total paid</span>
                <span>₦{Number(bookingDetails.amountPaid ?? 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Host */}
            {host && (
              <div className="flex items-center gap-3 pt-3 border-t border-neutral-100">
                <div className="w-8 h-8 rounded-full bg-bt-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-bt-primary" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Hosted by</p>
                  <p className="text-sm font-semibold text-neutral-800 capitalize">
                    {host.firstName} {host.lastName}
                  </p>
                  {host.phoneNumber && (
                    <p className="text-xs text-neutral-500">
                      +{host.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentSuccessWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-bt-primary" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

export default function PaymentSuccessPage() {
  return (
    <AuthGuard>
      <PaymentSuccessWrapper />
    </AuthGuard>
  );
}
