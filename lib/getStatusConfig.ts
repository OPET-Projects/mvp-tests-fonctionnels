import { RequestStatus } from "@/lib/enums/RequestStatus";

export function getStatusConfig(status: RequestStatus) {
  const config = {
    PENDING: { label: "En cours", variant: "pending" as const },
    ACCEPTED: { label: "Validé", variant: "accepted" as const },
    REJECTED: { label: "Refusé", variant: "rejected" as const },
  };

  return config[status];
}
