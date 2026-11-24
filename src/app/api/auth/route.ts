import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { DEFAULT_ACCOUNTS } from "@/lib/authStorage";
import { AuthUser, StoredAccount, UserRole } from "@/types/pharminvin";

const globalAuthStore = globalThis as unknown as {
  __pharminvinUsers?: StoredAccount[];
};

function getServerAccounts(clientAccounts?: StoredAccount[]): StoredAccount[] {
  if (!globalAuthStore.__pharminvinUsers) {
    globalAuthStore.__pharminvinUsers = [...DEFAULT_ACCOUNTS];
  }

  // Merge client-persisted accounts so Vercel serverless cold starts never lose registrations
  const mergedMap = new Map<string, StoredAccount>();
  for (const acc of DEFAULT_ACCOUNTS) {
    mergedMap.set(acc.email.toLowerCase(), acc);
  }
  for (const acc of globalAuthStore.__pharminvinUsers) {
    mergedMap.set(acc.email.toLowerCase(), acc);
  }
  if (Array.isArray(clientAccounts)) {
    for (const acc of clientAccounts) {
      if (acc?.email && acc?.password) {
        mergedMap.set(acc.email.toLowerCase(), acc);
      }
    }
  }

  return Array.from(mergedMap.values());
}

function stripPassword(account: StoredAccount): AuthUser {
  return {
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    role: account.role,
    facility: account.facility,
    licenseId: account.licenseId,
    age: account.age,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mode: "login" | "signup" | "demo";
      email?: string;
      password?: string;
      fullName?: string;
      role?: UserRole;
      facility?: string;
      licenseId?: string;
      age?: number;
      clientAccounts?: StoredAccount[];
    };

    const { mode } = body;

    // 1. Instant 1-Click Demo Access (Admin, Doctor, or Patient)
    if (mode === "demo") {
      const selectedRole: UserRole =
        body.role === "patient"
          ? "patient"
          : body.role === "doctor"
          ? "doctor"
          : "admin";

      const demoAccount =
        DEFAULT_ACCOUNTS.find((a) => a.role === selectedRole) ||
        DEFAULT_ACCOUNTS[0];

      return NextResponse.json({
        user: stripPassword(demoAccount),
        backend: isSupabaseConfigured ? "supabase-ready" : "local-registry",
      });
    }

    const normalizedEmail = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const accounts = getServerAccounts(body.clientAccounts);

    // 2. New Account Registration (Patient, Doctor, or Admin / Pharmacist)
    if (mode === "signup") {
      const cleanName = (body.fullName || "").trim();
      if (cleanName.length < 2) {
        return NextResponse.json(
          { error: "Please enter your full name." },
          { status: 400 }
        );
      }

      const selectedRole: UserRole =
        body.role === "doctor"
          ? "doctor"
          : body.role === "admin"
          ? "admin"
          : "patient";

      const existing = accounts.find(
        (a) => a.email.toLowerCase() === normalizedEmail
      );
      if (existing) {
        return NextResponse.json(
          {
            error:
              "An account with this email already exists. Please switch to Sign In.",
          },
          { status: 409 }
        );
      }

      let userId = `${selectedRole.slice(0, 3)}-${Date.now()}`;
      let backendUsed = "local-registry";

      // If Supabase is connected, register in Supabase Auth as well
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: cleanName,
              role: selectedRole,
              facility: body.facility || "",
              license_id: body.licenseId || "",
            },
          },
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (data.user?.id) {
          userId = data.user.id;
          backendUsed = "supabase";
        }
      }

      const defaultFacility =
        selectedRole === "patient"
          ? "Patient Digital Care Portal"
          : selectedRole === "doctor"
          ? "Pharminvin Clinical Network"
          : "Pharminvin Pharmacy Hub";

      const newAccount: StoredAccount = {
        id: userId,
        email: normalizedEmail,
        password,
        fullName:
          selectedRole === "doctor" && !cleanName.toLowerCase().startsWith("dr.")
            ? `Dr. ${cleanName}`
            : cleanName,
        role: selectedRole,
        facility: (body.facility || "").trim() || defaultFacility,
        licenseId:
          selectedRole !== "patient"
            ? (body.licenseId || "").trim() ||
              `${selectedRole === "doctor" ? "MCI" : "PHARM"}-${Math.floor(
                10000 + Math.random() * 90000
              )}`
            : undefined,
        age: selectedRole === "patient" ? Number(body.age) || 30 : undefined,
        createdAt: new Date().toISOString(),
      };

      globalAuthStore.__pharminvinUsers = [
        newAccount,
        ...(globalAuthStore.__pharminvinUsers || []),
      ];

      return NextResponse.json(
        {
          user: stripPassword(newAccount),
          account: newAccount,
          backend: backendUsed,
        },
        { status: 201 }
      );
    }

    // 3. Sign In with Real Credential Verification
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!error && data.user) {
        const meta = data.user.user_metadata || {};
        const roleFromMeta = (meta.role as UserRole) || "patient";
        const supabaseUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || normalizedEmail,
          fullName: meta.full_name || normalizedEmail.split("@")[0],
          role: roleFromMeta,
          facility:
            meta.facility ||
            (roleFromMeta === "patient"
              ? "Patient Digital Care Portal"
              : "Pharminvin Cloud Network"),
          licenseId: meta.license_id || undefined,
        };
        return NextResponse.json({ user: supabaseUser, backend: "supabase" });
      }
    }

    const matchedAccount = accounts.find(
      (a) => a.email.toLowerCase() === normalizedEmail
    );

    if (!matchedAccount) {
      return NextResponse.json(
        {
          error:
            "No account found with this email. Click 'Register Account' to create a new Patient or Doctor account.",
        },
        { status: 401 }
      );
    }

    if (matchedAccount.password !== password) {
      return NextResponse.json(
        { error: "Incorrect password. Please check your password and try again." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: stripPassword(matchedAccount),
      backend: "local-registry",
    });
  } catch {
    return NextResponse.json(
      { error: "Authentication service encountered an unexpected error." },
      { status: 500 }
    );
  }
}
