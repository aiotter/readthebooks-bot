import {
  APITextChannel,
  APIThreadChannel,
  RESTGetAPIGuildChannelsResult,
  RESTGetAPIGuildThreadsResult,
} from "https://deno.land/x/discord_api_types@0.27.3/v9.ts";
import * as config from "./config.ts";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bot ${config.token}`,
};

const guildThreads = await fetch(
  `https://discord.com/api/v9/guilds/${config.guildId}/threads/active`,
  { method: "GET", headers },
).then((r) => r.json() as Promise<RESTGetAPIGuildThreadsResult>);

const threadRootChannelIds = await fetch(
  `https://discord.com/api/v9/guilds/${config.guildId}/channels`,
  { method: "GET", headers },
)
  .then((r) => r.json() as Promise<RESTGetAPIGuildChannelsResult>)
  .then((result) =>
    result
      .filter((channel) =>
        (channel as APITextChannel).parent_id === config.threadsCategory
      )
      .map((channel) => channel.id)
  );

(guildThreads.threads as APIThreadChannel[])
  .filter((thread) => threadRootChannelIds.includes(thread.parent_id!))
  .map(async (thread) => {
    if (thread.last_message_id) {
      // Calculate timestamp from snowflake
      const lastMessageTimestamp =
        (BigInt(thread.last_message_id) >> BigInt("22")) +
        BigInt("1420070400000");

      // Extend the thread life by changing its auto_archive_duration
      // if someone has written to it in the last 2 weeks
      if (
        BigInt(Date.now()) - lastMessageTimestamp < 14 * 24 * 60 * 60 * 1000
      ) {
        await fetch(
          `https://discord.com/api/v9/channels/${thread.id}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ auto_archive_duration: 60 }),
          },
        ).then(() =>
          fetch(
            `https://discord.com/api/v9/channels/${thread.id}`,
            {
              method: "PATCH",
              headers,
              body: JSON.stringify({ auto_archive_duration: 1440 }),
            },
          )
        );
      }
    }
  });
