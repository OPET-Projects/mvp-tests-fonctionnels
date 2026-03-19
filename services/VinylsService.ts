import { Vinyl } from "@/lib/types/vinyls";

export async function getAllVinylsByUserId(userId: number): Promise<Vinyl[]> {
    const res = await fetch('/api/vinyls', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId }),
    });

    if (!res.ok) {
        throw new Error('Impossible de charger les vinyls');
    }

    return res.json();
}

export async function getVinyl(vinylId: number): Promise<Vinyl[]> {
    const res = await fetch(`/api/vinyls/${vinylId}`, {
        method: 'Get',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!res.ok) {
        throw new Error('Impossible de charger les vinyls');
    }
    return res.json();
}