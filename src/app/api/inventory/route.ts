import { NextResponse } from "next/server";
import { getServerStore } from "@/lib/store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { InventoryBatch } from "@/types/pharminvin";

export async function GET() {
  const store = getServerStore();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("inventory_batches")
      .select("*")
      .order("expiry_date", { ascending: true });

    if (!error && data && data.length > 0) {
      const mapped: InventoryBatch[] = data.map((row) => ({
        id: row.id,
        batchId: row.batch_id,
        name: row.name,
        genericName: row.generic_name,
        manufacturer: row.manufacturer,
        category: row.category,
        manufactureDate: row.manufacture_date,
        expiryDate: row.expiry_date,
        quantity: Number(row.quantity),
        reorderPoint: Number(row.reorder_point),
        unitPrice: Number(row.unit_price),
        shelfZoneId: row.shelf_zone_id,
        shelfZoneLabel: row.shelf_zone_label,
        status: row.status,
        velocity: row.velocity,
      }));
      return NextResponse.json({ batches: mapped, source: "supabase" });
    }
  }

  return NextResponse.json({ batches: store.inventory, source: "memory" });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Omit<InventoryBatch, "id" | "status">;
    const store = getServerStore();

    const newBatch: InventoryBatch = {
      ...body,
      id: `inv-${Date.now()}`,
      status: "active",
    };

    store.inventory = [newBatch, ...store.inventory];

    if (isSupabaseConfigured && supabase) {
      await supabase.from("inventory_batches").insert({
        id: newBatch.id,
        batch_id: newBatch.batchId,
        name: newBatch.name,
        generic_name: newBatch.genericName,
        manufacturer: newBatch.manufacturer,
        category: newBatch.category,
        manufacture_date: newBatch.manufactureDate,
        expiry_date: newBatch.expiryDate,
        quantity: newBatch.quantity,
        reorder_point: newBatch.reorderPoint,
        unit_price: newBatch.unitPrice,
        shelf_zone_id: newBatch.shelfZoneId,
        shelf_zone_label: newBatch.shelfZoneLabel,
        status: newBatch.status,
        velocity: newBatch.velocity,
      });
    }

    return NextResponse.json({ batch: newBatch }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create inventory batch." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id: string;
      action: "dispense" | "quarantine" | "restock";
      amount?: number;
    };
    const store = getServerStore();
    const index = store.inventory.findIndex((item) => item.id === body.id);

    if (index === -1) {
      return NextResponse.json({ error: "Batch not found." }, { status: 404 });
    }

    const current = { ...store.inventory[index] };

    if (body.action === "dispense") {
      const qtyToDispense = Math.max(1, body.amount ?? 10);
      current.quantity = Math.max(0, current.quantity - qtyToDispense);
      if (current.quantity === 0) current.status = "depleted";
    } else if (body.action === "quarantine") {
      current.status = "quarantined";
    } else if (body.action === "restock") {
      current.quantity += Math.max(1, body.amount ?? 50);
      if (current.status === "depleted") current.status = "active";
    }

    store.inventory[index] = current;

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from("inventory_batches")
        .update({ quantity: current.quantity, status: current.status })
        .eq("id", current.id);
    }

    return NextResponse.json({ batch: current });
  } catch {
    return NextResponse.json(
      { error: "Unable to update batch." },
      { status: 400 }
    );
  }
}
