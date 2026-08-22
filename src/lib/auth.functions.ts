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

    const client = createClient(url, publishable, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let email = data.identifier;

    if (!email.includes("@")) {
      // Resolves the email only when the password matches (no enumeration).
      const { data: resolved, error: rpcError } = await client.rpc("email_for_login", {
        _username: email.toLowerCase(),
        _password: data.password,
      });

      if (rpcError || !resolved) {
        return { error: "Invalid credentials" as const, session: null };
      }
      email = resolved as string;
    }

    const { data: signIn, error } = await client.auth.signInWithPassword({
      email,
      password: data.password,
    });

    if (error || !signIn.session) {
      return { error: "Invalid credentials" as const, session: null };
    }

    return { error: null, session: signIn.session };
  });
