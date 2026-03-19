'use client'

import VinylsListing from "@/components/vinyls/VinylsListing";
import {Vinyl} from "@/lib/types/vinyls";
import {useEffect, useState} from "react";
import {getAllVinylsByUserId} from "@/services/VinylsService";

export default function VinylsPage() {
    const [vinyls, setVinyls] = useState<Vinyl[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userId, setUserId] = useState<number>(0);

    useEffect(() => {
        const storedId = window.localStorage.getItem("userId") as string;
        setUserId(Number.parseInt(storedId, 10));
    }, []);

    useEffect(() => {
        const fetchVinyls = async () => {
            try {
                const data = await getAllVinylsByUserId(userId);
                setVinyls(data);
            } catch {
                setError('Impossible de charger les vinyls');
            } finally {
                setLoading(false);
            }
        };

        if (userId > 0) {
            fetchVinyls().then();
        }
    }, [userId]);

    if (loading) return <p className="p-6 text-gray-600">Chargement…</p>
    if (error) return <p className="p-6 text-red-600">{error}</p>
    if (!vinyls.length) return <p className="p-6 text-gray-600">Aucun vinyle disponible</p>

    return <VinylsListing vinyls={vinyls}/>;
}