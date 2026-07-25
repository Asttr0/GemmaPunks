import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError, getAuthSession, registerBusiness } from "./api";

describe("auth API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers a business with the Firebase ID token", async () => {
    const responseBody = {
      user: {
        user_id: "user-123",
        organization_id: "merchant-atlas-market",
        role: "owner" as const,
        email: "owner@example.com",
        display_name: "Owner",
      },
      profile: null,
      organization: {
        organization_id: "merchant-atlas-market",
        name: "Atlas Market",
        type: "MERCHANT" as const,
        status: "ACTIVE" as const,
        city: "Berrechid",
        coarse_area: "Berrechid Center",
        currency: "MAD",
      },
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await registerBusiness(
      {
        email: "owner@example.com",
        display_name: "Owner",
        organization_name: "Atlas Market",
        organization_type: "MERCHANT",
      },
      "firebase-token",
    );

    expect(result).toEqual(responseBody);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/auth/signup",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer firebase-token",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("loads the server-owned session without writing to Firestore", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            user_id: "user-123",
            organization_id: "supplier-atlas",
            role: "owner",
          },
          profile: null,
          organization: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getAuthSession("firebase-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer firebase-token",
        }),
      }),
    );
  });

  it("surfaces the backend error detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ detail: "Existing account setup is incomplete" }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    await expect(
      registerBusiness(
        {
          email: "owner@example.com",
          display_name: "Owner",
          organization_name: "Atlas Market",
          organization_type: "MERCHANT",
        },
        "firebase-token",
      ),
    ).rejects.toEqual(
      new ApiRequestError("Existing account setup is incomplete", 409),
    );
  });
});
