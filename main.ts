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
import nacl from "https://esm.sh/tweetnacl@1.0.3";
import * as config from "./config.ts";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bot ${config.token}`,
};

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

    const member = interaction.member!;
    const memberId = member!.user.id;
    const roleId = option.value;
    const role = interaction.data.resolved!.roles![roleId]!;

    if (member.roles.includes(roleId)) {
      // Remove role
      const response = await fetch(
        `https://discord.com/api/v9/guilds/${config.guildId}/members/${memberId}/roles/${role.id}`,
        { method: "DELETE", headers },
      );
      if (response.ok) {
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: `<@&${role.id}> を取り外しました`,
            flags: MessageFlags.Ephemeral,
          },
        };
      } else {
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: "その役職は取り外しできません",
            flags: MessageFlags.Ephemeral,
          },
        };
      }
    } else {
      // Add role
      const response = await fetch(
        `https://discord.com/api/v9/guilds/${config.guildId}/members/${memberId}/roles/${role.id}`,
        { method: "PUT", headers },
      );
      if (response.ok) {
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: `<@&${role.id}> を追加しました`,
            flags: MessageFlags.Ephemeral,
          },
        };
      } else {
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: "その役職は追加できません",
            flags: MessageFlags.Ephemeral,
          },
        };
      }
    }
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

  const isValid = nacl.sign.detached.verify(
    new TextEncoder().encode(
      request.headers.get("X-Signature-Timestamp")! + body,
    ),
    hexToUint8Array(request.headers.get("X-Signature-Ed25519")!),
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
    return new Response(JSON.stringify(responseData), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
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
