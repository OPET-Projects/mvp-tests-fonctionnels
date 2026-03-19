'use client'

import VinylsListing from "@/components/vinyls/VinylsListing";
import {Vinyl} from "@/lib/types/vinyls";
import {useEffect, useState} from "react";

export default function VinylsPage() {

    const [vinyls, setVinyls] = useState<Vinyl[]>([]);
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const loadVinyls = async () => {

        try {
            const res = await fetch('/api/vinyls', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({id: 4}),
            });
            if (!res.ok) {
                setError('Impossible de charger les vinyls')
                return
            }
            const data = await res.json();
            setVinyls(data);
        } catch {
            setError('Impossible de charger les vinyls')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadVinyls().then();
    }, [])

    if (loading) return <p className="p-6 text-gray-600">Chargement…</p>
    if (error) return <p className="p-6 text-red-600">{error}</p>
    if (!vinyls.length) return <p className="p-6 text-gray-600">Aucun vinyle disponible</p>

    return (
        <VinylsListing vinyls={vinyls}/>
    );
}