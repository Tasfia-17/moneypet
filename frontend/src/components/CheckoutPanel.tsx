/**
 * Checkout panel — shows Locus Checkout when pet creates a session.
 */
"use client";
import dynamic from "next/dynamic";

// Dynamically import to avoid SSR issues
const LocusCheckout = dynamic(
  () => import("@withlocus/checkout-react").then((m) => m.LocusCheckout),
  { ssr: false }
);

interface Props {
  sessionId: string;
  onPaid: (amount: string) => void;
  onClose: () => void;
}

export default function CheckoutPanel({ sessionId, onPaid, onClose }: Props) {
  if (!sessionId) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-4 w-96 shadow-2xl">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800">Pay {"\u{1F43E}"} Penny</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>
        <LocusCheckout
          sessionId={sessionId}
          mode="embedded"
          onSuccess={(data) => {
            onPaid(data.amount);
            onClose();
          }}
          onCancel={onClose}
          onError={(e) => console.error(e)}
        />
      </div>
    </div>
  );
}
