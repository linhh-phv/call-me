import { BACKEND_URL } from './config';

export type User = { id: string; name: string; avatar: string };

export type TokenResponse = {
  token: string;
  url: string;
  identity: string;
  room: string;
};

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${BACKEND_URL}/users`);
  if (!res.ok) throw new Error(`fetchUsers failed: ${res.status}`);
  return res.json();
}

export async function fetchToken(userId: string, room: string): Promise<TokenResponse> {
  const res = await fetch(`${BACKEND_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, room }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fetchToken failed: ${res.status} ${text}`);
  }
  return res.json();
}
