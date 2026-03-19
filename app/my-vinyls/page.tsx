"use client";

import VinylsListing from "@/components/vinyls/VinylsListing";
import { Vinyl } from "@/lib/types/vinyls";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const MyVinylsPage = () => {
  const [vinyls, setVinyls] = useState<Vinyl[]>([]);
  const [loading, setLoading] = useState(true)

  const userId = useMemo(() => {
    const storedId = localStorage.getItem("userId") as string;
    return Number.parseInt(storedId, 10);
  }, []);

  const loadVinyls = async (userId: number) => {
    try {
      const res = await fetch(`/api/vinyls/user/${userId}`);
      if (!res.ok) {
        toast.error("Impossible de charger les vinyles. Veuillez réessayer.");
        return
      }
      const data = await res.json();
      setVinyls(data);
    } catch {
      toast.error("Impossible de charger les vinyles. Veuillez réessayer.");
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVinyls(userId)
  }, [userId]);

  if (loading) return <p className="p-6 text-gray-600">Chargement…</p>
  if (!vinyls.length) return <p className="p-6 text-gray-600">Aucun vinyle disponible</p>

  return (
    <VinylsListing vinyls={vinyls} haveTradeButton={false} />
  );
}

export default MyVinylsPage;