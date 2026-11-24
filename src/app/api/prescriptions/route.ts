import { NextResponse } from "next/server";
import { getServerStore } from "@/lib/store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function GET() {
  const store = getServerStore();
  return NextResponse.json({ prescriptions: store.prescriptions });
}

export async function PATCH(request: Request) {
  try {
    const { prescriptionId, medId, slot } = (await request.json()) as {
      prescriptionId: string;
      medId: string;
      slot: "morning" | "afternoon" | "night";
    };

    const store = getServerStore();
    const rxIdx = store.prescriptions.findIndex((p) => p.id === prescriptionId);
    if (rxIdx === -1) {
      return NextResponse.json(
        { error: "Prescription not found." },
        { status: 404 }
      );
    }

    const updatedRx = {
      ...store.prescriptions[rxIdx],
      medications: store.prescriptions[rxIdx].medications.map((m) =>
        m.id === medId
          ? {
              ...m,
              takenToday: {
                ...m.takenToday,
                [slot]: !m.takenToday[slot],
              },
            }
          : m
      ),
    };

    store.prescriptions[rxIdx] = updatedRx;

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from("prescriptions")
        .update({ medications: updatedRx.medications })
        .eq("id", updatedRx.id);
    }

    return NextResponse.json({ prescription: updatedRx });
  } catch {
    return NextResponse.json(
      { error: "Unable to toggle dosage adherence." },
      { status: 400 }
    );
  }
}
