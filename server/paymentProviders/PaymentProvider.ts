import { Message } from "discord.js";

export interface PaymentParseResult {
  success: boolean;
  donorName?: string;
  amount?: number;
  error?: string;
}

export interface PaymentProvider {
  name: string;
  parseWebhookMessage(message: Message): PaymentParseResult;
}
