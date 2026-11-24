import { NextResponse } from "next/server";
import { getServerStore } from "@/lib/store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { RestockOrder, RestockOrderItem } from "@/types/pharminvin";

const STATUS_FLOW: RestockOrder["status"][] = [
  "Submitted",
  "Dispatched",
  "Cold-Chain Transit",
  "Delivered",
];

export async function GET() {
  const store = getServerStore();
  return NextResponse.json({
    suppliers: store.suppliers,
    orders: store.orders,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      supplierId: string;
      supplierName: string;
      etaHours: number;
      items: RestockOrderItem[];
    };

    const totalCost = body.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const newOrder: RestockOrder = {
      id: `ord-${Date.now()}`,
      orderCode: `PO-PHV-${new Date().getFullYear()}-${Math.floor(
        100 + Math.random() * 900
      )}`,
      supplierId: body.supplierId,
      supplierName: body.supplierName,
      items: body.items,
      totalCost: Math.round(totalCost),
      status: "Submitted",
      etaHours: body.etaHours,
      createdAt: new Date().toISOString(),
    };

    const store = getServerStore();
    store.orders = [newOrder, ...store.orders];

    if (isSupabaseConfigured && supabase) {
      await supabase.from("restock_orders").insert({
        id: newOrder.id,
        order_code: newOrder.orderCode,
        supplier_id: newOrder.supplierId,
        supplier_name: newOrder.supplierName,
        items: newOrder.items,
        total_cost: newOrder.totalCost,
        status: newOrder.status,
        eta_hours: newOrder.etaHours,
      });
    }

    return NextResponse.json({ order: newOrder }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate smart restock order." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { orderId } = (await request.json()) as { orderId: string };
    const store = getServerStore();
    const idx = store.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const order = { ...store.orders[idx] };
    const currentStep = STATUS_FLOW.indexOf(order.status);
    order.status = STATUS_FLOW[Math.min(STATUS_FLOW.length - 1, currentStep + 1)];
    if (order.status === "Delivered") order.etaHours = 0;

    store.orders[idx] = order;

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from("restock_orders")
        .update({ status: order.status, eta_hours: order.etaHours })
        .eq("id", order.id);
    }

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { error: "Failed to advance order status." },
      { status: 400 }
    );
  }
}
