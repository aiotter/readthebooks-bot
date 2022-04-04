import { config } from "https://deno.land/std@0.133.0/dotenv/mod.ts";

const {
  APPLICATION_ID,
  PUBLIC_KEY,
  TOKEN,
  GUILD_ID,
  THREADS_CATEGORY,
} = await config({ safe: true });

export {
  APPLICATION_ID as applicationId,
  GUILD_ID as guildId,
  PUBLIC_KEY as publicKey,
  THREADS_CATEGORY as threadsCategory,
  TOKEN as token,
};
