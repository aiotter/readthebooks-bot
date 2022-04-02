import { config } from "https://deno.land/std@0.133.0/dotenv/mod.ts";
await config({ safe: true });

export const applicationId = Deno.env.get("APPLICATION_ID")!;
export const publicKey = Deno.env.get("PUBLIC_KEY")!;
export const guildId = Deno.env.get("GUILD_ID")!;
export const token = Deno.env.get("TOKEN")!;
