import config from "./bot-config.json" assert { type: "json" };
import roles from "./roles.json" assert { type: "json" };

const TOKEN = Deno.env.get("TOKEN");

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

  const { type = 0, data = { options: [] }, member = null } = JSON.parse(body);
  // Discord performs Ping interactions to test our application.
  // Type 1 in a request implies a Ping interaction.
  if (type === 1) {
    return json({
      type: 1, // Type 1 in a response is a Pong interaction response type.
    });
  }

  // Type 2 in a request is an ApplicationCommand interaction.
  // It implies that a user has issued a command.
  if (type === 2) {
    const { value } = data.options.find((option) => option.name === "role");
    if (roles.map((role) => role.id).includes(value)) {
      const memberId = member!.user.id;
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bot ${TOKEN}`,
      };

      if (member!.roles.includes(value)) {
        // Remove role
        await fetch(
          `https://discord.com/api/v9/guilds/${config.guildId}/members/${memberId}/roles/${value}`,
          { method: "DELETE", headers },
        );
        return json({ type: 4, data: { content: "役職を取り外しました" } });
      } else {
        // Add role
        await fetch(
          `https://discord.com/api/v9/guilds/${config.guildId}/members/${memberId}/roles/${value}`,
          { method: "PUT", headers },
        );
        return json({ type: 4, data: { content: "役職を追加しました" } });
      }
    }
    return json({
      // Type 4 responds with the below message retaining the user's
      // input at the top.
      type: 4,
      data: { content: "その役職は追加/削除できません" },
    });
  }

  // We will return a bad request error as a valid Discord request
  // shouldn't reach here.
  return json({ error: "bad request" }, { status: 400 });
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
