import { RequestStatus } from "@/lib/enums/RequestStatus";
import { Vinyl } from "@/lib/types/vinyls";

export interface StoredUser {
  id: number;
  name: string;
}

export interface ExchangeRequest {
  id: number;
  status: RequestStatus;
  vinyl_a: number;
  vinyl_b: number;
}

export interface ExchangeUser {
  id: number;
  name: string;
}

export interface EnrichedExchangeRequest extends ExchangeRequest {
  vinylA: Vinyl;
  vinylB: Vinyl;
  userA: ExchangeUser;
  userB: ExchangeUser;
}

export interface Message {
  id: number;
  content: string;
  user_id: number;
  request_id: number;
  created_at: string;
}
