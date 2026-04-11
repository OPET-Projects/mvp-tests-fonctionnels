"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import VinylItem from "@/components/vinyls/VinylItem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusConfig } from "@/lib/getStatusConfig";
import { EnrichedExchangeRequest, Message } from "@/lib/types/exchanges";
import { RequestStatus } from "@/lib/enums/RequestStatus";
import { fetchEnrichedExchangeRequestById } from "@/services/ExchangesService";

export default function ExchangeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [exchange, setExchange] = useState<EnrichedExchangeRequest | null>(null);
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem("userId");
    if (!storedId) {
      router.push("/");
      return;
    }
    setCurrentUserId(Number(storedId));
  }, [router]);

  useEffect(() => {
    if (!currentUserId || !id) return;

    async function loadData() {
      try {
        const [enriched, messagesRes] = await Promise.all([
          fetchEnrichedExchangeRequestById(Number(id)),
          fetch(`/api/messages/${id}`),
        ]);
        setExchange(enriched);
        const messagesData = await messagesRes.json();
        setMessages(Array.isArray(messagesData) ? messagesData : []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUserId, id]);

  async function handleStatusUpdate(status: RequestStatus) {
    await fetch(`/api/requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.push("/exchanges");
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: newMessage,
        user_id: currentUserId,
        request_id: Number(id),
      }),
    });

    setNewMessage("");
    const res = await fetch(`/api/messages/${id}`);
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
  }

  if (loading) return <p className="p-6 text-gray-600">Chargement…</p>;
  if (error || !exchange) return <p className="p-6 text-red-600">Impossible de charger l&apos;échange.</p>;

  const isReceiver = currentUserId === exchange.vinylB.user_id;
  const isPending = exchange.status === RequestStatus.PENDING;
  const statusConfig = getStatusConfig(exchange.status);

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8">

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Détail de l&apos;échange</h1>
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">Récapitulatif</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">
              Vinyle proposé par {exchange.userA.name}
            </p>
            <VinylItem vinyl={exchange.vinylA} footer={false} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">
              Vinyle demandé à {exchange.userB.name}
            </p>
            <VinylItem vinyl={exchange.vinylB} footer={false} />
          </div>
        </div>
      </section>

      {isReceiver && isPending && (
        <section className="flex gap-3">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleStatusUpdate(RequestStatus.ACCEPTED)}
          >
            Accepter l&apos;échange
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleStatusUpdate(RequestStatus.REJECTED)}
          >
            Refuser l&apos;échange
          </Button>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">Négociation</h2>
        <div className="border rounded-lg p-4 space-y-3 min-h-48 bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-sm text-center pt-8">
              Aucun message pour le moment.
            </p>
          ) : (
            messages.map((msg, index) => {
              const isOwn = msg.user_id === currentUserId;
              const senderName = msg.user_id === exchange.userA.id
                ? exchange.userA.name
                : exchange.userB.name;
              const showName = index === 0 || messages[index - 1].user_id !== msg.user_id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}
                >
                  {showName && (
                    <span className="text-xs text-gray-400">{senderName}</span>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 max-w-xs text-sm ${
                      isOwn
                        ? "bg-blue-500 text-white"
                        : "bg-white border text-gray-800"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })
          )}
        </div>
        {isPending && (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Votre message…"
              className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" disabled={!newMessage.trim()}>
              Envoyer
            </Button>
          </form>
        )}
      </section>

    </div>
  );
}
