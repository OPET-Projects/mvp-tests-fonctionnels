import {
  EnrichedExchangeRequest,
  ExchangeRequest,
  ExchangeUser,
} from "@/lib/types/exchanges";
import { Vinyl } from "@/lib/types/vinyls";

function unwrapApiResult<T>(payload: T | Array<T>): T {
  return Array.isArray(payload) ? payload[0] : payload;
}

async function fetchExchangeUser(userId: number): Promise<ExchangeUser> {
  const response = await fetch(`/api/users/${userId}`);
  const payload = await response.json() as ExchangeUser | Array<ExchangeUser>;
  return unwrapApiResult(payload);
}

async function fetchVinyl(vinylId: number): Promise<Vinyl> {
  const response = await fetch(`/api/vinyls/${vinylId}`);
  const payload = await response.json() as Vinyl | Array<Vinyl>;
  return unwrapApiResult(payload);
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
  const response = await fetch(path);
  const payload = await response.json() as unknown;
  return Array.isArray(payload) ? payload as Array<ExchangeRequest> : [];
}

export async function fetchCurrentExchangeUser(userId: number): Promise<ExchangeUser> {
  return fetchExchangeUser(userId);
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
