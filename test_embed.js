const embed = {
  title: "Donasi Masuk Dari FDY Sebesar 1.000",
  description: "Terima kasih!",
  author: { name: "Saweria" },
  footer: { text: "Powered by Saweria" },
  fields: [{name: "Message", value: "Keep it up!"}]
};

const embedParts = [
  embed.title,
  embed.description,
  embed.author?.name,
  embed.footer?.text,
  ...(embed.fields?.map(f => `${f.name} ${f.value}`) || [])
].filter(Boolean).join('\n');

console.log(embedParts);
