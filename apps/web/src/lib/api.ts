import type { components } from "../../../../packages/contracts/generated-types/api";
import { getIdToken } from "firebase/auth";
import { firebaseAuth } from "./firebase";

export type AuthResponse = components["schemas"]["AuthResponse"];
export type SignUpRequest = components["schemas"]["SignUpRequest"];

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

const apiBaseUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as {
      detail?: string | Array<{ msg?: string }>;
    };

    if (typeof payload.detail === "string") {
      return payload.detail;
    }

    const validationMessage = payload.detail?.find((item) => item.msg)?.msg;
    if (validationMessage) {
      return validationMessage;
    }
  } catch {
    // The API may return an empty or non-JSON response.
  }

  return `Request failed with status ${response.status}`;
};

const authRequest = async <T>(
  path: string,
  idToken: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${idToken}`,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiRequestError(
      await readErrorMessage(response),
      response.status,
    );
  }

  return (await response.json()) as T;
};

export const registerBusiness = (
  request: SignUpRequest,
  idToken: string,
): Promise<AuthResponse> =>
  authRequest<AuthResponse>("/api/v1/auth/signup", idToken, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

export const getAuthSession = (idToken: string): Promise<AuthResponse> =>
  authRequest<AuthResponse>("/api/v1/auth/me", idToken);

export async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  const token = await getIdToken(firebaseAuth.currentUser!);

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || response.statusText);
  }

  return response.json() as Promise<T>;
}
