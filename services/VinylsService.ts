import { Vinyl } from "@/lib/types/vinyls";
import { apiCall } from "@/lib/api";

export async function getAllVinylsByUserId(userId: number): Promise<Vinyl[]> {
    return apiCall<Vinyl[]>(`/api/vinyls/user/${userId}`);
}

export async function getAllVinyls(userId: number): Promise<Vinyl[]> {
    return apiCall<Vinyl[]>(`/api/vinyls/`, {
        method: "POST",
        body: JSON.stringify({ id: userId }),
    });
}

export async function getVinyl(vinylId: number): Promise<Vinyl> {
    return apiCall<Vinyl>(`/api/vinyls/${vinylId}`);
}
