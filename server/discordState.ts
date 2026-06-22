import { Client } from "discord.js";

export const discordState = {
  client: null as Client | null,
  botStatus: "OFFLINE" as "OFFLINE" | "CONNECTING" | "ONLINE" | "ERROR",
  botErrorLog: null as string | null,
  botLatency: 0,
  joinedServersCount: 0
};
