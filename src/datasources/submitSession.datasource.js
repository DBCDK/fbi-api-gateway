import { set } from "./redis.datasource";

export async function load({ accessToken, session }) {
  const key = `session_${accessToken}`;
  const seconds = 60 * 60 * 24 * 30; // a month
  await set(key, seconds, session);
}
