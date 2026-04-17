import {
  EnrichedExchangeRequest,
  ExchangeRequest,
  ExchangeUser,
} from "@/lib/types/exchanges";
import { Vinyl } from "@/lib/types/vinyls";
import { apiCall } from "@/lib/api";

async function fetchExchangeUser(userId: number): Promise<ExchangeUser> {
  return apiCall<ExchangeUser>(`/api/users/${userId}`);
}

async function fetchVinyl(vinylId: number): Promise<Vinyl> {
  return apiCall<Vinyl>(`/api/vinyls/${vinylId}`);
}

async function enrichExchangeRequest(
  request: ExchangeRequest,
): Promise<EnrichedExchangeRequest> {
  const [vinylA, vinylB] = await Promise.all([
    fetchVinyl(request.vinyl_a),
    fetchVinyl(request.vinyl_b),
  ]);

  const [userA, userB] = await Promise.all([
    fetchExchangeUser(vinylA.user_id),
    fetchExchangeUser(vinylB.user_id),
  ]);

  return { ...request, vinylA, vinylB, userA, userB };
}

/**
 * Récupère en un seul appel HTTP les demandes envoyées et reçues
 * par un utilisateur, déjà enrichies (vinyles + utilisateurs).
 * S'appuie sur l'endpoint GET /api/requests/enriched/:userId
 * qui fait un SQL avec JOINs pour éviter les N+1 requêtes.
 */
export async function fetchEnrichedExchangeRequests(userId: number): Promise<{
  sentRequests: Array<EnrichedExchangeRequest>;
  receivedRequests: Array<EnrichedExchangeRequest>;
}> {
  return apiCall<{
    sentRequests: Array<EnrichedExchangeRequest>;
    receivedRequests: Array<EnrichedExchangeRequest>;
  }>(`/api/requests/enriched/${userId}`);
}

export async function fetchEnrichedExchangeRequestById(id: number): Promise<EnrichedExchangeRequest> {
  const request = await apiCall<ExchangeRequest>(`/api/requests/${id}`);
  return enrichExchangeRequest(request);
}
