"use client";

import BarterForm from "@/components/vinyls/BarterForm";

export default function BarterRequestPage() {
  return (
    <BarterForm
      vinyl={{
        id: 1,
        name: "Vinyl 1",
        description: "Description du vinyl 1",
        user_id: 1,
        id_request_a: null,
        id_request_b: null,
      }}
      propositions={[
        {
          id: 2,
          name: "Vinyl 2",
          description: "Description du vinyl 2",
          user_id: 2,
          id_request_a: null,
          id_request_b: null,
        },
        {
          id: 3,
          name: "Vinyl 3",
          description: "Description du vinyl 3",
          user_id: 1,
          id_request_a: null,
          id_request_b: null,
        },
      ]}
    />
  );
}
