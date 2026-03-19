"use client";

import VinylsListing from "@/components/vinyls/VinylsListing";
import { Vinyl } from "@/lib/types/vinyls";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const MyVinylsPage = () => {
  const [vinyls, setVinyls] = useState<Vinyl[]>([]);
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  const loadVinyls = async () => {
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        toast.error("Utilisateur non connecté. Veuillez vous connecter pour voir vos vinyles.");
        setLoading(false)
        router.push('/')
        return
      }
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
    loadVinyls().then()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <p className="p-6 text-gray-600">Chargement…</p>
  if (!vinyls.length) return <p className="p-6 text-gray-600">Aucun vinyle disponible</p>

  return (
    <VinylsListing vinyls={vinyls} />
  );
}

export default MyVinylsPage;