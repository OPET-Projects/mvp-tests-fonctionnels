import { RequestStatus } from "../enums/RequestStatus";

export interface Request {
    id:number;
    status:RequestStatus;
    articleA:number;
    articleB:number;
}