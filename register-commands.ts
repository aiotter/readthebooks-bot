import * as config from "./config.ts";
import commands from "./commands.json" assert { type: "json" };

function registerCommand() {
  const error = new Error();
  fetch(
    `https://discord.com/api/v9/applications/${config.applicationId}/guilds/${config.guildId}/commands`,
    {
      method: "PUT",
      body: JSON.stringify(commands),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${config.token}`,
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
