// @vitest-environment node
import { POST as signIn } from "@/app/api/auth/route";
import { GET as getProfile } from "@/app/api/profile/route";
import { createRequestSession } from "@/lib/server/supabase";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const projectUrl = "https://project.supabase.co";
const secretKey = "sb_secret_test_key";
const user = { id: "00000000-0000-4000-8000-000000000001" };

beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", projectUrl);
  vi.stubEnv("SUPABASE_SECRET_KEY", secretKey);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("uses the secret in apikey and keeps the signed-in user's JWT for data", async () => {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const accessToken = [
    { alg: "HS256", typ: "JWT" },
    { sub: user.id, exp: expiresAt, role: "authenticated" },
    "test-signature",
  ]
    .map((part) => Buffer.from(JSON.stringify(part)).toString("base64url"))
    .join(".");
  const profile = { user_id: user.id, display_name: "Meow" };
  const fetchSupabase = vi.fn<typeof fetch>(async (input, init) => {
    const headers = new Headers(init?.headers);
    expect(headers.get("apikey")).toBe(secretKey);
    expect(init?.redirect).toBe("error");

    const url = new URL(String(input));
    expect(url.origin).toBe(projectUrl);
    if (url.pathname === "/auth/v1/token") {
      expect(headers.get("authorization")).toBeNull();
      expect(url.searchParams.get("grant_type")).toBe("password");
      return Response.json({
        access_token: accessToken,
        refresh_token: "test-refresh-token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: expiresAt,
        user,
      });
    }

    expect(headers.get("authorization")).toBe(`Bearer ${accessToken}`);
    if (url.pathname === "/auth/v1/user") return Response.json(user);
    expect(url.pathname).toBe("/rest/v1/profiles");
    expect(url.searchParams.get("user_id")).toBe(`eq.${user.id}`);
    return Response.json(profile);
  });
  vi.stubGlobal("fetch", fetchSupabase);

  const login = await signIn(
    new NextRequest("https://meowpaid.test/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-meowpaid": "1" },
      body: JSON.stringify({
        email: "meow@example.com",
        password: "test-password",
      }),
    }),
  );
  expect(login.status).toBe(200);
  expect(login.headers.get("set-cookie")).toContain("HttpOnly");
  expect(login.headers.get("set-cookie")).not.toContain(secretKey);
  const signedIn = new NextRequest("https://meowpaid.test/api/profile");
  for (const { name, value } of login.cookies.getAll()) {
    if (value) signedIn.cookies.set(name, value);
  }

  const response = await getProfile(signedIn);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(profile);
  expect(fetchSupabase).toHaveBeenCalledTimes(3);
});

it("prevents unauthenticated data requests from falling back to the secret key", async () => {
  const fetchSupabase = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchSupabase);
  const request = new NextRequest("https://meowpaid.test/api/profile");

  expect((await getProfile(request)).status).toBe(401);

  const { supabase } = createRequestSession(request);
  const { error, status } = await supabase.from("profiles").select();
  expect(status).toBe(401);
  expect(error?.message).toContain(
    "Supabase request requires a user access token",
  );
  expect(fetchSupabase).not.toHaveBeenCalled();
});

it("rejects a publishable key supplied as the server secret", () => {
  vi.stubEnv("SUPABASE_SECRET_KEY", "sb_publishable_test_key");
  expect(() =>
    createRequestSession(new NextRequest("https://meowpaid.test")),
  ).toThrow("SUPABASE_SECRET_KEY must be a Supabase secret API key");
});
