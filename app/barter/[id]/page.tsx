"use client";

import BarterForm from "@/components/vinyls/BarterForm";
import { useEffect, useState } from "react";
import { Vinyl } from "@/lib/types/vinyls";
import {getAllVinylsByUserId, getVinyl} from "@/services/VinylsService";
import {useParams} from "next/navigation";

export default function BarterRequestPage() {

    const params = useParams();
    const id = Number(params.id);

    const [vinyl, setVinyl] = useState<Vinyl>({} as Vinyl);
    const [vinyls, setVinyls] = useState<Vinyl[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userId, setUserId] = useState<number>(0);

    useEffect(() => {
        const storedId = window.localStorage.getItem("userId") as string;
        const id = Number.parseInt(storedId, 10);
        setUserId(id);
    }, []);

    useEffect(() => {
        const fetchVinyls = async () => {
            try {
                const vinyl = await getVinyl(id);
                const data = await getAllVinylsByUserId(userId);
                setVinyl(vinyl);
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
    }, [id, userId]);

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
