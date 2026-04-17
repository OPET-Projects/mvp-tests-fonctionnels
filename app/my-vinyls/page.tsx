"use client";

import VinylsListing from "@/components/vinyls/VinylsListing";
import { Vinyl } from "@/lib/types/vinyls";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAllVinylsByUserId } from "@/services/VinylsService";

const MyVinylsPage = () => {
  const [vinyls, setVinyls] = useState<Vinyl[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const userId = Number.parseInt(
      localStorage.getItem("userId") ?? "0",
      10,
    );
    if (!userId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await getAllVinylsByUserId(userId);
        if (!cancelled) setVinyls(data);
      } catch {
        if (!cancelled) {
          toast.error("Impossible de charger les vinyles. Veuillez réessayer.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="p-6 text-gray-600">Chargement…</p>
  if (!vinyls.length) return <p className="p-6 text-gray-600">Aucun vinyle disponible</p>

  return (
    <VinylsListing vinyls={vinyls} haveTradeButton={false} />
  );
}

export default MyVinylsPage;
