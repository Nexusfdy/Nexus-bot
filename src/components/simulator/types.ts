export interface DiscordMsg {
  id: string;
  author: {
    username: string;
    avatarUrl?: string;
    isBot: boolean;
    roleColor?: string;
  };
  content: string;
  timestamp: Date;
  embed?: {
    title?: string;
    description?: string;
    color?: string; // Hex eg "#5865F2"
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    footer?: string;
  };
  isSystem?: boolean;
}
