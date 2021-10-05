import { get } from "./redis.datasource";

export async function load({ accessToken }) {
  const key = `session_${accessToken}`;
  const session = await get(key);
  if (session && session.val) {
    return session.val;
  }
}
