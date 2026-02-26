import { RequestStatus } from "../enums/RequestStatus";

export interface Request {
    id: string;
    status: RequestStatus;
    articleA: string;
    articleB: string;
}