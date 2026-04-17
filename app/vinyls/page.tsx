'use client'

import VinylsListing from "@/components/vinyls/VinylsListing";
import {Vinyl} from "@/lib/types/vinyls";
import {useEffect, useState} from "react";
import {getAllVinyls} from "@/services/VinylsService";

export default function VinylsPage() {
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
                const data = await getAllVinyls(userId);
                if (!cancelled) setVinyls(data);
            } catch {
                if (!cancelled) setError('Impossible de charger les vinyls');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) return <p className="p-6 text-gray-600">Chargement…</p>
    if (error) return <p className="p-6 text-red-600">{error}</p>
    if (!vinyls.length) return <p className="p-6 text-gray-600">Aucun vinyle disponible</p>

    return <VinylsListing vinyls={vinyls}/>;
}
