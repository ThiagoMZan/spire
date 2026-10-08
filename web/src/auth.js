import { reactive } from "vue";
export const auth = reactive({ user: null });
export async function authRequest(path, options = {}) {
  const response = await fetch(`/api/auth/${path}`, {
    ...options, credentials: "same-origin",
    headers: { ...(options.body != null ? { "Content-Type": "application/json" } : {}), "X-Spire-Request": "1" },
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || "request_failed");
    error.status = response.status;
    throw error;
  }
  return data;
}
export async function refreshUser() {
  try { auth.user = (await authRequest("me")).user; }
  catch (error) {
    if (error.status !== 401) throw error;
    auth.user = null;
  }
}
