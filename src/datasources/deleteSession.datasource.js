import { del } from "./redis/redis.datasource";

export async function load({ accessToken }) {
  const key = `session_${accessToken}`;
  await del(key);
}
