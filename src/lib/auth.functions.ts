import { createServerFn } from "@tanstack/react-start";

export const signInWithIdentifier = createServerFn({ method: "POST" })
  .inputValidator((data: { identifier: string; password: string }) => {
    const identifier = String(data?.identifier ?? "").trim();
    const password = String(data?.password ?? "");
    if (!identifier || !password) throw new Error("Missing credentials");
    return { identifier, password };
  })
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env["SUPABASE_URL"]!;
    const publishable = process.env["SUPABASE_PUBLISHABLE_KEY"]!;

    let email = data.identifier;

    if (!email.includes("@")) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      // Use maybeSingle to get one profile efficiently
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("username", email.toLowerCase())
        .maybeSingle();

      if (!profile) return { error: "Invalid credentials" as const, session: null };

      const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      if (!userRes?.user?.email) return { error: "Invalid credentials" as const, session: null };
      email = userRes.user.email;
    }

    const client = createClient(url, publishable, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: signIn, error } = await client.auth.signInWithPassword({
      email,
      password: data.password,
    });

    if (error || !signIn.session) {
      return { error: "Invalid credentials" as const, session: null };
    }

    return {
      error: null,
      session: signIn.session,
    };
  });
