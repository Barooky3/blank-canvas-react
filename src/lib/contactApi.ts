import { supabase } from "@/integrations/supabase/client";

export type ContactMessage = {
  id: string;
  sender: "customer" | "admin";
  body: string;
  created_at: string;
};

export type Conversation = {
  id: string;
  customer_name: string;
  customer_email: string;
  subject: string;
  status: "new" | "active";
  admin_unread: boolean;
  created_at: string;
  last_message_at: string;
  messages: ContactMessage[];
};

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

async function adminHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// ---- public ----
export async function submitContact(input: {
  name: string; email: string; subject: string; message: string;
}): Promise<{ ok: true; id: string }> {
  const res = await fetch("/api/contact/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parse(res);
}

export async function getReplyThread(token: string) {
  const res = await fetch(`/api/contact/reply?token=${encodeURIComponent(token)}`);
  return parse<{
    conversation: { id: string; customer_name: string; subject: string; status: string; created_at: string };
    messages: ContactMessage[];
  }>(res);
}

export async function sendCustomerReply(token: string, body: string) {
  const res = await fetch("/api/contact/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, body }),
  });
  return parse<{ ok: true; message: ContactMessage }>(res);
}

// ---- admin ----
export async function adminListConversations(): Promise<Conversation[]> {
  const res = await fetch("/api/contact/admin", { headers: await adminHeaders() });
  const data = await parse<{ conversations: Conversation[] }>(res);
  return data.conversations;
}

export async function adminReply(conversationId: string, body: string) {
  const res = await fetch("/api/contact/admin", {
    method: "POST",
    headers: await adminHeaders(),
    body: JSON.stringify({ action: "reply", conversationId, body }),
  });
  return parse<{ ok: true; emailed: boolean; emailError?: string }>(res);
}

export async function adminMarkRead(conversationId: string) {
  const res = await fetch("/api/contact/admin", {
    method: "POST",
    headers: await adminHeaders(),
    body: JSON.stringify({ action: "read", conversationId }),
  });
  return parse<{ ok: true }>(res);
}

export async function adminDeleteConversation(id: string) {
  const res = await fetch(`/api/contact/admin?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: await adminHeaders(),
  });
  return parse<{ ok: true }>(res);
}
