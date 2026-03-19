"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import VinylItem from "@/components/vinyls/VinylItem";
import { getStatusConfig } from "@/lib/getStatusConfig";
import {
  EnrichedExchangeRequest,
  ExchangeRequest,
  ExchangeUser,
  StoredUser,
} from "@/lib/types/exchanges";
import { Vinyl } from "@/lib/types/vinyls";

export const dynamic = 'force-dynamic';

function unwrapApiResult<T>(payload: T | Array<T>): T {
  return Array.isArray(payload) ? payload[0] : payload;
}

export default function ExchangesPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");
  const [sentRequests, setSentRequests] = useState<Array<EnrichedExchangeRequest>>([]);
  const [receivedRequests, setReceivedRequests] = useState<Array<EnrichedExchangeRequest>>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        router.push("/");
        return;
      }

      const userData = JSON.parse(userStr) as StoredUser;
      console.log('User data from localStorage:', userData);
      setUserName(userData.name);
      setCurrentUserId(userData.id);

      if (!userData.id) {
        console.error('User ID is missing, please login again');
        localStorage.removeItem("user");
        router.push("/");
        return;
      }

      setLoading(true);

      try {
        const [sentResponse, receivedResponse] = await Promise.all([
          fetch(`/api/requests/sender/${userData.id}`),
          fetch(`/api/requests/receiver/${userData.id}`),
        ]);

        const sent = await sentResponse.json() as unknown;
        const received = await receivedResponse.json() as unknown;
        const sentArray = Array.isArray(sent) ? sent as Array<ExchangeRequest> : [];
        const receivedArray = Array.isArray(received) ? received as Array<ExchangeRequest> : [];

        console.log('Sent array:', sentArray);
        console.log('Received array:', receivedArray);

        const enrichSent = await Promise.all(
          sentArray.map(async (req: ExchangeRequest) => {
            console.log('Processing request:', req);
            const [vinylARes, vinylBRes] = await Promise.all([
              fetch(`/api/vinyls/${req.vinyl_a}`),
              fetch(`/api/vinyls/${req.vinyl_b}`),
            ]);
            const vinylAData = await vinylARes.json() as Vinyl | Array<Vinyl>;
            const vinylBData = await vinylBRes.json() as Vinyl | Array<Vinyl>;
            const vinylA = unwrapApiResult(vinylAData);
            const vinylB = unwrapApiResult(vinylBData);

            console.log('VinylA:', vinylA, 'VinylB:', vinylB);

            const [userARes, userBRes] = await Promise.all([
              fetch(`/api/users/${vinylA.user_id}`),
              fetch(`/api/users/${vinylB.user_id}`),
            ]);
            const userAData = await userARes.json() as ExchangeUser | Array<ExchangeUser>;
            const userBData = await userBRes.json() as ExchangeUser | Array<ExchangeUser>;
            const userA = unwrapApiResult(userAData);
            const userB = unwrapApiResult(userBData);

            return { ...req, vinylA, vinylB, userA, userB };
          })
        );

        const enrichReceived = await Promise.all(
          receivedArray.map(async (req: ExchangeRequest) => {
            const [vinylARes, vinylBRes] = await Promise.all([
              fetch(`/api/vinyls/${req.vinyl_a}`),
              fetch(`/api/vinyls/${req.vinyl_b}`),
            ]);
            const vinylAData = await vinylARes.json() as Vinyl | Array<Vinyl>;
            const vinylBData = await vinylBRes.json() as Vinyl | Array<Vinyl>;
            const vinylA = unwrapApiResult(vinylAData);
            const vinylB = unwrapApiResult(vinylBData);

            const [userARes, userBRes] = await Promise.all([
              fetch(`/api/users/${vinylA.user_id}`),
              fetch(`/api/users/${vinylB.user_id}`),
            ]);
            const userAData = await userARes.json() as ExchangeUser | Array<ExchangeUser>;
            const userBData = await userBRes.json() as ExchangeUser | Array<ExchangeUser>;
            const userA = unwrapApiResult(userAData);
            const userB = unwrapApiResult(userBData);

            return { ...req, vinylA, vinylB, userA, userB };
          })
        );

        setSentRequests(enrichSent);
        setReceivedRequests(enrichReceived);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const requests = activeTab === "sent" ? sentRequests : receivedRequests;

  if (!userName) return null;

  return (
      <main className="min-h-screen">
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

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : !currentUserId ? (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">Aucun utilisateur trouvé.</p>
        </div>
      ) : requests.length === 0 ? (
        <p className="text-gray-500">
          {activeTab === "sent"
            ? "Aucune demande envoyée pour le moment."
            : "Aucune demande reçue pour le moment."}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((request) => {
            if (!currentUserId) return null;

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
                            ? "Vous proposez votre vinyle contre celui de l'autre utilisateur."
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
      </main>
  );
}
