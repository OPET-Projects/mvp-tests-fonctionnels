"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import VinylItem from "@/components/vinyls/VinylItem";
import { getStatusConfig } from "@/lib/getStatusConfig";
import { EnrichedExchangeRequest } from "@/lib/types/exchanges";
import { fetchEnrichedExchangeRequests } from "@/services/ExchangesService";

export const dynamic = 'force-dynamic';

export default function ExchangesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");
  const [sentRequests, setSentRequests] = useState<Array<EnrichedExchangeRequest>>([]);
  const [receivedRequests, setReceivedRequests] = useState<Array<EnrichedExchangeRequest>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      const storedId = localStorage.getItem("userId");
      if (!storedId) {
        router.push("/");
        return;
      }

      try {
        const userId = Number(storedId);
        setCurrentUserId(userId);

        const { sentRequests, receivedRequests } = await fetchEnrichedExchangeRequests(userId);
        setSentRequests(sentRequests);
        setReceivedRequests(receivedRequests);
      } catch (error) {
        console.error("Error loading data:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const requests = activeTab === "sent" ? sentRequests : receivedRequests;

  if (loading) return <p className="p-6 text-gray-600">Chargement…</p>;
  if (error) return <p className="p-6 text-red-600">Impossible de charger les échanges. Veuillez réessayer.</p>;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Mes demandes d&apos;échange</h1>

      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab("sent")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "sent"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Demandes envoyées ({sentRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("received")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "received"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Demandes reçues ({receivedRequests.length})
        </button>
      </div>

      {requests.length === 0 ? (
        <p className="p-6 text-gray-600">
          {activeTab === "sent"
            ? "Aucune demande envoyée pour le moment."
            : "Aucune demande reçue pour le moment."}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((request) => {
            const isOwnerA = request.vinylA.user_id === currentUserId;
            const myVinyl = isOwnerA ? request.vinylA : request.vinylB;
            const otherVinyl = isOwnerA ? request.vinylB : request.vinylA;
            const otherUser = isOwnerA ? request.userB : request.userA;
            const statusConfig = getStatusConfig(request.status);

            return (
              <Link key={request.id} href={`/exchanges/${request.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardAction>
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </CardAction>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <CardTitle>
                          {activeTab === "sent" ? "Demande envoyée à" : "Demande reçue de"} {otherUser.name}
                        </CardTitle>
                        <CardDescription>
                          {activeTab === "sent"
                            ? `Vous proposez votre vinyle contre celui de ${otherUser.name}.`
                            : `${otherUser.name} propose son vinyle contre le vôtre.`}
                        </CardDescription>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600">
                            {activeTab === "sent" ? "Votre proposition" : `${otherUser.name} propose`}
                          </p>
                          <VinylItem vinyl={activeTab === "sent" ? myVinyl : otherVinyl} footer={false} />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600">
                            {activeTab === "sent" ? "En échange de" : "Votre vinyle demandé"}
                          </p>
                          <VinylItem vinyl={activeTab === "sent" ? otherVinyl : myVinyl} footer={false} />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
