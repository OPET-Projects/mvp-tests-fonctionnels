import { NextRequest, NextResponse } from "next/server";
import { connection } from "@/services/DbConnector";
import { NegotiationCommandService } from "@/services/NegotiationCommandService";

type BarterRequest = {
  vinyl: string;
  items: string[];
  message: string;
};

const MIN_MESSAGE_LENGTH = 10;

export async function POST(request: NextRequest) {
  let payload: BarterRequest | null = null;

  try {
    payload = (await request.json()) as BarterRequest;
  } catch {
    return NextResponse.json(
      { error: "Corps de requete invalide." },
      { status: 400 }
    );
  }

  const vinyl = typeof payload?.vinyl === "string" ? payload.vinyl : "";
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const message = typeof payload?.message === "string" ? payload.message : "";

  const targetVinylId = Number.parseInt(vinyl, 10);
  const offeredVinylIds = items
    .map((item) => Number.parseInt(item, 10))
    .filter(
      (itemId) => Number.isInteger(itemId) && itemId > 0 && itemId !== targetVinylId,
    );

  if (
    !Number.isInteger(targetVinylId) ||
    targetVinylId <= 0 ||
    offeredVinylIds.length === 0 ||
    message.trim().length < MIN_MESSAGE_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          "Selectionnez au moins un article et ajoutez un message plus detaille.",
      },
      { status: 400 }
    );
  }

  const sql = await connection();
  const commands = new NegotiationCommandService(sql);

  try {
    await Promise.all(
      offeredVinylIds.map((offeredVinylId) =>
        commands.proposeExchange(offeredVinylId, targetVinylId)
      )
    );

    return NextResponse.json({
      ok: true,
      count: offeredVinylIds.length,
      receivedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { detail: "request failed" },
      { status: 500 }
    );
  }
}
