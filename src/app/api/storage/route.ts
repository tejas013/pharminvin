import { NextResponse } from "next/server";
import { getServerStore } from "@/lib/store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function GET() {
  const store = getServerStore();
  return NextResponse.json({ zones: store.storageZones });
}

export async function PATCH(request: Request) {
  try {
    const { zoneId, action } = (await request.json()) as {
      zoneId: string;
      action: "breach" | "stabilize";
    };
    const store = getServerStore();
    const idx = store.storageZones.findIndex((z) => z.id === zoneId);

    if (idx === -1) {
      return NextResponse.json({ error: "Zone not found." }, { status: 404 });
    }

    const zone = { ...store.storageZones[idx] };
    const nowLabel = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    if (action === "breach") {
      const spikedTemp = Number((zone.maxTemp + 5.6).toFixed(1));
      const spikedHumidity = Math.min(89, zone.maxHumidity + 19);
      zone.currentTemp = spikedTemp;
      zone.humidity = spikedHumidity;
      zone.status = "breach";
      zone.breachReason = `Thermal excursion detected (+${(
        spikedTemp - zone.maxTemp
      ).toFixed(1)}°C above ceiling). Door seal / compressor anomaly.`;
      zone.telemetry = [
        ...zone.telemetry.slice(-8),
        { time: nowLabel, temp: spikedTemp, humidity: spikedHumidity },
      ];
    } else {
      const nominalTemp = Number(((zone.minTemp + zone.maxTemp) / 2).toFixed(1));
      const nominalHumidity = Math.max(35, zone.maxHumidity - 12);
      zone.currentTemp = nominalTemp;
      zone.humidity = nominalHumidity;
      zone.status = "optimal";
      zone.breachReason = undefined;
      zone.telemetry = [
        ...zone.telemetry.slice(-8),
        { time: nowLabel, temp: nominalTemp, humidity: nominalHumidity },
      ];
    }

    store.storageZones[idx] = zone;

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from("storage_zones")
        .update({
          current_temp: zone.currentTemp,
          humidity: zone.humidity,
          status: zone.status,
          breach_reason: zone.breachReason || null,
        })
        .eq("id", zone.id);
    }

    return NextResponse.json({ zone });
  } catch {
    return NextResponse.json(
      { error: "Unable to update storage telemetry." },
      { status: 400 }
    );
  }
}
