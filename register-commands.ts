import config from "./bot-config.json" assert { type: "json" };
import commands from "./commands.json" assert { type: "json" };

const botToken = Deno.env.get("TOKEN")!;

function registerCommand() {
  const error = new Error();
  fetch(
    `https://discord.com/api/v9/applications/${config.applicationId}/guilds/${config.guildId}/commands`,
    {
      method: "PUT",
      body: JSON.stringify(commands),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${botToken}`,
      },
    },
  ).then(async (response) => {
    if (!response.ok) {
      error.name = `${response.status} ${response.statusText}`;
      error.message = await response.text();
      throw error;
    }
    console.log(await response.json());
  });
}

if (import.meta.main) {
  registerCommand();
}
