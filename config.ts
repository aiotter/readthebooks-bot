import { config } from "https://deno.land/std@0.133.0/dotenv/mod.ts";

const {
  APPLICATION_ID = Deno.env.get("APPLICATION_ID")!,
  PUBLIC_KEY = Deno.env.get("PUBLIC_KEY")!,
  TOKEN = Deno.env.get("TOKEN")!,
  GUILD_ID = Deno.env.get("GUILD_ID")!,
  THREADS_CATEGORY = Deno.env.get("THREADS_CATEGORY")!,
} = await config({ safe: true });

export {
  APPLICATION_ID as applicationId,
  GUILD_ID as guildId,
  PUBLIC_KEY as publicKey,
  THREADS_CATEGORY as threadsCategory,
  TOKEN as token,
};
