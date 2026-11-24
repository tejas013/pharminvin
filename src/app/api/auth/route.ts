import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { AuthUser, UserRole } from "@/types/pharminvin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, email, password, fullName, role } = body as {
      mode: "login" | "signup" | "demo";
      email: string;
      password?: string;
      fullName?: string;
      role?: UserRole;
    };

    if (mode === "demo") {
      const selectedRole: UserRole = role === "patient" ? "patient" : "admin";
      const demoUser: AuthUser =
        selectedRole === "admin"
          ? {
              id: "demo-admin-01",
              email: "dr.sharma@pharminvin.ai",
              fullName: "Dr. Rohan Sharma, PharmD",
              role: "admin",
              facility: "Pharminvin Command Hub — Navi Mumbai",
            }
          : {
              id: "demo-patient-01",
              email: "aarav.deshmukh@patient.in",
              fullName: "Aarav Deshmukh",
              role: "patient",
              facility: "Patient Digital Care Portal",
            };

      return NextResponse.json({
        user: demoUser,
        backend: isSupabaseConfigured ? "supabase-ready" : "local-fallback",
      });
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured && supabase) {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || "Pharminvin Member", role: role || "admin" },
          },
        });
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        const user: AuthUser = {
          id: data.user?.id || `sb-${Date.now()}`,
          email,
          fullName: fullName || email.split("@")[0],
          role: role || "admin",
          facility:
            role === "patient"
              ? "Patient Digital Care Portal"
              : "Pharminvin Cloud Pharmacy",
        };
        return NextResponse.json({ user, backend: "supabase" });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 401 });
        }
        const meta = data.user.user_metadata || {};
        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: meta.full_name || email.split("@")[0],
          role: (meta.role as UserRole) || role || "admin",
          facility:
            meta.role === "patient"
              ? "Patient Digital Care Portal"
              : "Pharminvin Cloud Pharmacy",
        };
        return NextResponse.json({ user, backend: "supabase" });
      }
    }

    // Automatic Live Fallback Auth
    const derivedRole: UserRole =
      role || (email.toLowerCase().includes("patient") ? "patient" : "admin");
    const fallbackUser: AuthUser = {
      id: `usr-${Date.now()}`,
      email,
      fullName:
        fullName?.trim() ||
        email
          .split("@")[0]
          .replace(/[._-]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      role: derivedRole,
      facility:
        derivedRole === "patient"
          ? "Patient Digital Care Portal"
          : "Pharminvin Command Hub — Navi Mumbai",
    };

    return NextResponse.json({ user: fallbackUser, backend: "local-fallback" });
  } catch {
    return NextResponse.json(
      { error: "Authentication request failed." },
      { status: 500 }
    );
  }
}
