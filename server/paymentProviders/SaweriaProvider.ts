import { Message } from "discord.js";
import { PaymentProvider, PaymentParseResult } from "./PaymentProvider.ts";

export class SaweriaProvider implements PaymentProvider {
  name = "saweria";

  parseWebhookMessage(message: Message): PaymentParseResult {
    let contentToParse = message.content || "";
    
    console.log(`[Saweria] Received webhook message ${message.id}`);
    console.log(`[Saweria] Raw content: "${contentToParse}"`);

    if (message.embeds && message.embeds.length > 0) {
      const embed = message.embeds[0];
      const embedParts = [
        embed.title,
        embed.description,
        embed.author?.name,
        embed.footer?.text,
        ...(embed.fields?.map(f => `${f.name} ${f.value}`) || [])
      ].filter(Boolean).join('\n');
      
      console.log(`[Saweria] Embed parts extracted: "${embedParts}"`);
      contentToParse += `\n${embedParts}`;
    }

    // Strip markdown formatting for easier regex matching
    contentToParse = contentToParse.replace(/[*_\`~]/g, '');

    const patterns = [
      /Donasi\s+Masuk\s+Dari\s+(.*?)\s+Sebesar\s+(?:Rp|IDR)?\s*([\d.,]+)/i,
      /(.*?)\s+just\s+donated\s+(?:Rp|IDR)\s*([\d.,]+)/i,
      /(.*?)\s+telah\s+berdonasi\s+sebesar\s+(?:Rp|IDR)\s*([\d.,]+)/i,
      /(.*?)\s+berdonasi\s+(?:Rp|IDR)\s*([\d.,]+)/i
    ];

    let saweriaMatch = null;
    let matchedPatternIndex = -1;
    for (let i = 0; i < patterns.length; i++) {
      const match = contentToParse.match(patterns[i]);
      if (match) {
        saweriaMatch = match;
        matchedPatternIndex = i;
        break;
      }
    }

    if (saweriaMatch) {
      const donorName = saweriaMatch[1].trim();
      const amountStr = saweriaMatch[2].replace(/[^\d]/g, '');
      const amount = parseInt(amountStr, 10);
      
      console.log(`[Saweria] Regex matched (Pattern ${matchedPatternIndex})! Username: "${donorName}", Amount: ${amount}`);

      if (!isNaN(amount) && amount > 0) {
        return { success: true, donorName, amount };
      } else {
        console.log(`[Saweria] Parsed amount is invalid: ${amountStr}`);
        return { success: false, error: "Invalid amount parsed" };
      }
    }

    console.log(`[Saweria] Parsing failed. Content did not match any known format: "${contentToParse}"`);
    return { success: false, error: "Content format unrecognized" };
  }
}
