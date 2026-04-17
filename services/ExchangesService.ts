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

async function fetchExchangeRequests(path: string): Promise<Array<ExchangeRequest>> {
  return apiCall<Array<ExchangeRequest>>(path);
}

export async function fetchEnrichedExchangeRequests(userId: number): Promise<{
  sentRequests: Array<EnrichedExchangeRequest>;
  receivedRequests: Array<EnrichedExchangeRequest>;
}> {
  const [sentRequests, receivedRequests] = await Promise.all([
    fetchExchangeRequests(`/api/requests/sender/${userId}`),
    fetchExchangeRequests(`/api/requests/receiver/${userId}`),
  ]);

  const [enrichedSentRequests, enrichedReceivedRequests] = await Promise.all([
    Promise.all(sentRequests.map(enrichExchangeRequest)),
    Promise.all(receivedRequests.map(enrichExchangeRequest)),
  ]);

  return {
    sentRequests: enrichedSentRequests,
    receivedRequests: enrichedReceivedRequests,
  };
}

export async function fetchEnrichedExchangeRequestById(id: number): Promise<EnrichedExchangeRequest> {
  const request = await apiCall<ExchangeRequest>(`/api/requests/${id}`);
  return enrichExchangeRequest(request);
}
