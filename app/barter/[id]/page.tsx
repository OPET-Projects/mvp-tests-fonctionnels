"use client";

import BarterForm from "@/components/vinyls/BarterForm";

export default function BarterRequestPage() {
  return (
    <>
      <BarterForm
        vinyl={{
          id: 1,
          title: "Vinyl 1",
          description: "Description du vinyl 1",
          artist: "artist",
          user_id: "1",
          available: true,
        }}
        propositions={[
          {
            id: 2,
            title: "Vinyl 1",
            description: "Description du vinyl 1",
            artist: "artist",
            user_id: "2",
            available: true,
          },
          {
            id: 4,
            title: "Vinyl 1",
            description: "Description du vinyl 1",
            artist: "artist",
            user_id: "4",
            available: true,
          },
        ]}
      />
    </>
  );
}
