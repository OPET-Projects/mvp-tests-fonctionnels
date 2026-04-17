"use client";

import BarterForm from "@/components/vinyls/BarterForm";
import { useEffect, useState } from "react";
import { Vinyl } from "@/lib/types/vinyls";
import { getAllVinylsByUserId, getVinyl } from "@/services/VinylsService";
import { useParams } from "next/navigation";

export default function BarterRequestPage() {

    const params = useParams();
    const id = Number(params.id);

    const [vinyl, setVinyl] = useState<Vinyl>({} as Vinyl);
    const [vinyls, setVinyls] = useState<Vinyl[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const userId = Number.parseInt(
            window.localStorage.getItem("userId") ?? "0",
            10,
        );
        if (!userId) {
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const [target, owned] = await Promise.all([
                    getVinyl(id),
                    getAllVinylsByUserId(userId),
                ]);
                if (!cancelled) {
                    setVinyl(target);
                    setVinyls(owned);
                }
            } catch {
                if (!cancelled) setError('Impossible de charger les vinyls');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [id]);

    if (loading) return <p className="p-6 text-gray-600">Chargement…</p>;
    if (error) return <p className="p-6 text-red-600">{error}</p>;

    return (
      <>
        <BarterForm
            vinyl={vinyl}
            propositions={vinyls}
        />
      </>
    );
}
