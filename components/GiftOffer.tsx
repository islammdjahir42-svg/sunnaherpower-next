"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

type Gift = { id: number; name: string; price: number; image: string };
type Offer = { gift: Gift; label: string; trigger_ids: number[] };

export default function GiftOffer({ productId, wpUrl }: { productId: number; wpUrl: string }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);
  const [added, setAdded] = useState(false);
  const { add } = useCart();

  useEffect(() => {
    const key = `gift_shown_${productId}`;
    if (sessionStorage.getItem(key)) return;

    fetch(`${wpUrl}/wp-json/sunnaher/v1/gift-offer?product_id=${productId}`)
      .then(r => r.json())
      .then((d: { offers: Offer[] }) => {
        if (d.offers && d.offers.length > 0) {
          setOffers(d.offers);
          setTimeout(() => setVisible(true), 1500);
          sessionStorage.setItem(key, '1');
        }
      })
      .catch(() => {});
  }, [productId, wpUrl]);

  if (!visible || offers.length === 0) return null;

  const offer = offers[current];

  const handleAccept = () => {
    add({
      id: offer.gift.id,
      slug: 'gift',
      name: offer.gift.name,
      image: offer.gift.image,
      price: offer.gift.price,
    }, 1);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      if (current + 1 < offers.length) {
        setCurrent(current + 1);
      } else {
        setVisible(false);
      }
    }, 1000);
  };

  const handleDecline = () => {
    if (current + 1 < offers.length) {
      setCurrent(current + 1);
    } else {
      setVisible(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        {offers.length > 1 && (
          <p className="mb-3 text-center text-xs text-gray-400">{current + 1} / {offers.length}</p>
        )}
        <div className="mb-4 text-center">
          {offer.gift.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={offer.gift.image} alt={offer.gift.name} className="mx-auto mb-3 h-24 w-24 object-contain" />
          )}
          <p className="text-lg font-bold text-accent">{offer.label}</p>
          <p className="mt-1 text-sm text-gray-500">{offer.gift.name}</p>
          {offer.gift.price > 0 ? (
            <p className="mt-1 font-semibold text-green-600">মূল্য: ৳{offer.gift.price}</p>
          ) : (
            <p className="mt-1 font-semibold text-green-600">সম্পূর্ণ বিনামূল্যে!</p>
          )}
        </div>

        {added ? (
          <p className="text-center font-bold text-green-600">✅ যোগ হয়েছে!</p>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              className="flex-1 rounded-lg bg-accent py-3 font-bold text-white hover:bg-accent-dark"
            >
              হ্যাঁ, নিতে চাই
            </button>
            <button
              onClick={handleDecline}
              className="flex-1 rounded-lg border border-gray-300 py-3 font-bold text-gray-600 hover:bg-gray-50"
            >
              চাই না
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
