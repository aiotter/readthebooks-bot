import config from "./bot-config.json" assert { type: "json" };

const TOKEN = Deno.env.get("TOKEN");

interface Role {
  name: string;
  id: string;
}

async function registerCommand() {
  const commands = [{
    name: "role",
    description: "役職を追加する/取り外す",
    options: [
      { type: 8, name: "role", description: "追加/削除する役職", required: true },
    ],
  }];

  const response = await fetch(
    `https://discord.com/api/v9/applications/${config.applicationId}/guilds/${config.guildId}/commands`,
    {
      method: "PUT",
      body: JSON.stringify(commands),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${TOKEN}`,
      },
    },
  );
  console.log(response, await response.text());
}

if (import.meta.main) {
  registerCommand();
}
