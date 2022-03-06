import { serve } from "https://deno.land/std@0.128.0/http/server.ts";
import {
  APIApplicationCommandInteraction,
  APIApplicationCommandInteractionDataRoleOption,
  APIInteraction,
  APIInteractionResponse,
  APIInteractionResponseChannelMessageWithSource,
  APIInteractionResponsePong,
  APIPingInteraction,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from "https://deno.land/x/discord_api_types@0.27.3/v9.ts";
import * as ed from "https://esm.sh/@noble/ed25519@1.6.0";

import config from "./bot-config.json" assert { type: "json" };
import roles from "./roles.json" assert { type: "json" };

const botToken = Deno.env.get("TOKEN")!;

async function interact(
  interaction: APIPingInteraction,
): Promise<APIInteractionResponsePong>;

async function interact(
  interaction: APIApplicationCommandInteraction,
): Promise<APIInteractionResponseChannelMessageWithSource>;

async function interact(
  interaction: APIInteraction,
): Promise<APIInteractionResponse | void> {
  if (interaction.type === InteractionType.Ping) {
    return {
      type: InteractionResponseType.Pong,
    };
  }

  if (
    interaction.type === InteractionType.ApplicationCommand &&
    !("target_id" in interaction.data)
  ) {
    const option = interaction.data.options
      ?.find((option) =>
        option.name === "role"
      ) as APIApplicationCommandInteractionDataRoleOption;

    const role = roles.find((role) => role.id === option?.value);

    if (role) {
      const member = interaction.member!;
      const memberId = member!.user.id;
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bot ${botToken}`,
      };

      if (member.roles.includes(role.id)) {
        // Remove role
        await fetch(
          `https://discord.com/api/v9/guilds/${config.guildId}/members/${memberId}/roles/${role.id}`,
          { method: "DELETE", headers },
        );
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: { content: `「${role.name}」を取り外しました` },
        };
      } else {
        // Add role
        await fetch(
          `https://discord.com/api/v9/guilds/${config.guildId}/members/${memberId}/roles/${role.id}`,
          { method: "PUT", headers },
        );
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: { content: `「${role.name}」を追加しました` },
        };
      }
    }
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: "その役職は追加/削除できません", flags: MessageFlags.Ephemeral },
    };
  }
}

/** Converts a hexadecimal string to Uint8Array. */
function hexToUint8Array(hex: string) {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((val) => parseInt(val, 16)));
}

/** Process requests */
async function handler(request: Request) {
  // Accept only POST method
  if (request.method !== "POST") {
    if (request.method === "GET" || request.method === "HEAD") {
      return new Response("Not Found", {
        status: 404,
        statusText: "Not Found",
      });
    } else {
      return new Response("Method Not Allowed", {
        status: 405,
        statusText: "Method Not Allowed",
        headers: new URL(request.url).pathname === "/"
          ? { Allow: "POST" }
          : { Allow: "" },
      });
    }
  }

  // Reject requests without signature headers
  if (
    !request.headers.has("X-Signature-Ed25519") ||
    !request.headers.has("X-Signature-Timestamp")
  ) {
    return new Response("Bad Request", {
      status: 400,
      statusText: "Bad Request",
    });
  }

  // Verify signature
  const body = await request.text();
  // NOTE: Web crypto does not support Ed25519 yet
  // const key = await crypto.subtle.importKey(
  //   "raw",
  //   new TextEncoder().encode(publicKey),
  //   { name: "Ed25519" },
  //   true,
  //   ["verify"],
  // );
  // const isValid = await crypto.subtle.verify(
  //   { name: "ECDSA", hash: "SHA-512" },
  //   key,
  //   hexToUint8Array(request.headers.get("X-Signature-Ed25519")!),
  //   new TextEncoder().encode(
  //     request.headers.get("X-Signature-Timestamp")! + body
  //   ),
  // );

  const isValid = await ed.verify(
    hexToUint8Array(request.headers.get("X-Signature-Ed25519")!),
    ed.utils.bytesToHex(
      new TextEncoder().encode(
        request.headers.get("X-Signature-Timestamp")! + body,
      ),
    ),
    hexToUint8Array(config.publicKey),
  );

  if (!isValid) {
    return new Response("Unauthorized", {
      status: 401,
      statusText: "Unauthorized",
    });
  }

  // Resolve interaction
  const interaction = JSON.parse(body);
  const responseData = await interact(interaction);
  if (responseData) {
    return new Response(JSON.stringify(responseData));
  }

  // You won't reach here
  return new Response("Internal Server Error", {
    status: 500,
    statusText: "Internal Server Error",
  });
}

if (import.meta.main) {
  serve(async (request) => {
    const response = await handler(request);
    console.debug(request, "=>", response);
    return response;
  });
}
