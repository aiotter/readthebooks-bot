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
} from "https://deno.land/x/discord_api_types@0.27.3/v9.ts";
import config from "./bot-config.json" assert { type: "json" };
import roles from "./roles.json" assert { type: "json" };

const TOKEN = Deno.env.get("TOKEN");

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
        Authorization: `Bot ${TOKEN}`,
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
      data: { content: "その役職は追加/削除できません" },
    };
  }
}

// Sift is a small routing library that abstracts away details like starting a
// listener on a port, and provides a simple function (serve) that has an API
// to invoke a function for a specific path.
import {
  json,
  serve,
  validateRequest,
} from "https://deno.land/x/sift@0.4.3/mod.ts";
// TweetNaCl is a cryptography library that we use to verify requests
// from Discord.
import nacl from "https://cdn.skypack.dev/tweetnacl@v1.0.3?dts";

// For all requests to "/" endpoint, we want to invoke home() handler.
serve({
  "/": home,
});

// The main logic of the Discord Slash Command is defined in this function.
async function home(request: Request) {
  // validateRequest() ensures that a request is of POST method and
  // has the following headers.
  const { error } = await validateRequest(request, {
    POST: {
      headers: ["X-Signature-Ed25519", "X-Signature-Timestamp"],
    },
  });
  if (error) {
    return json({ error: error.message }, { status: error.status });
  }

  // verifySignature() verifies if the request is coming from Discord.
  // When the request's signature is not valid, we return a 401 and this is
  // important as Discord sends invalid requests to test our verification.
  const { valid, body } = await verifySignature(request);
  if (!valid) {
    return json(
      { error: "Invalid request" },
      {
        status: 401,
      },
    );
  }

  const interaction = JSON.parse(body);
  const response = json(await interact(interaction));

  // We will return a bad request error as a valid Discord request
  // shouldn't reach here.
  return response ?? json({ error: "bad request" }, { status: 400 });
}

/** Verify whether the request is coming from Discord. */
async function verifySignature(
  request: Request,
): Promise<{ valid: boolean; body: string }> {
  // Discord sends these headers with every request.
  const signature = request.headers.get("X-Signature-Ed25519")!;
  const timestamp = request.headers.get("X-Signature-Timestamp")!;
  const body = await request.text();
  const valid = nacl.sign.detached.verify(
    new TextEncoder().encode(timestamp + body),
    hexToUint8Array(signature),
    hexToUint8Array(config.publicKey),
  );

  return { valid, body };
}

/** Converts a hexadecimal string to Uint8Array. */
function hexToUint8Array(hex: string) {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((val) => parseInt(val, 16)));
}
