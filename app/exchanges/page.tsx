"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { getStatusConfig } from "@/lib/getStatusConfig";

export const dynamic = 'force-dynamic';

export default function ExchangesPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        router.push("/");
        return;
      }

      const userData = JSON.parse(userStr);
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

        const sent = await sentResponse.json();
        const received = await receivedResponse.json();
        const sentArray = Array.isArray(sent) ? sent : [];
        const receivedArray = Array.isArray(received) ? received : [];

        console.log('Sent array:', sentArray);
        console.log('Received array:', receivedArray);

        const enrichSent = await Promise.all(
          sentArray.map(async (req: any) => {
            console.log('Processing request:', req);
            const [vinylARes, vinylBRes] = await Promise.all([
              fetch(`/api/vinyls/${req.vinyl_a}`),
              fetch(`/api/vinyls/${req.vinyl_b}`),
            ]);
            const vinylAData = await vinylARes.json();
            const vinylBData = await vinylBRes.json();
            const vinylA = Array.isArray(vinylAData) ? vinylAData[0] : vinylAData;
            const vinylB = Array.isArray(vinylBData) ? vinylBData[0] : vinylBData;

            console.log('VinylA:', vinylA, 'VinylB:', vinylB);

            const [userARes, userBRes] = await Promise.all([
              fetch(`/api/users/${vinylA.user_id}`),
              fetch(`/api/users/${vinylB.user_id}`),
            ]);
            const userAData = await userARes.json();
            const userBData = await userBRes.json();
            const userA = Array.isArray(userAData) ? userAData[0] : userAData;
            const userB = Array.isArray(userBData) ? userBData[0] : userBData;

            return { ...req, vinylA, vinylB, userA, userB };
          })
        );

        const enrichReceived = await Promise.all(
          receivedArray.map(async (req: any) => {
            const [vinylARes, vinylBRes] = await Promise.all([
              fetch(`/api/vinyls/${req.vinyl_a}`),
              fetch(`/api/vinyls/${req.vinyl_b}`),
            ]);
            const vinylAData = await vinylARes.json();
            const vinylBData = await vinylBRes.json();
            const vinylA = Array.isArray(vinylAData) ? vinylAData[0] : vinylAData;
            const vinylB = Array.isArray(vinylBData) ? vinylBData[0] : vinylBData;

            const [userARes, userBRes] = await Promise.all([
              fetch(`/api/users/${vinylA.user_id}`),
              fetch(`/api/users/${vinylB.user_id}`),
            ]);
            const userAData = await userARes.json();
            const userBData = await userBRes.json();
            const userA = Array.isArray(userAData) ? userAData[0] : userAData;
            const userB = Array.isArray(userBData) ? userBData[0] : userBData;

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
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-200 rounded shrink-0 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Image</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="mb-2">
                          {activeTab === "sent" ? "Demande envoyée à" : "Demande reçue de"} {otherUser.name}
                        </CardTitle>
                        <CardDescription>
                          <span className="font-medium">
                            {activeTab === "sent" ? "Vous proposez" : `${otherUser.name} propose`} :
                          </span>{" "}
                          {activeTab === "sent" ? myVinyl.title : otherVinyl.title} {activeTab === "sent" ? myVinyl.artiste : otherVinyl.artiste}
                          {" → "}
                          <span className="font-medium">Contre :</span>{" "}
                          {activeTab === "sent" ? otherVinyl.title : myVinyl.title} {activeTab === "sent" ? otherVinyl.artiste : myVinyl.artiste}
                        </CardDescription>
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
