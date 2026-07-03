const contents = [
  "Donasi Masuk Dari FDY Sebesar 1.000",
  "Donasi Masuk Dari Kentosgaming Sebesar 10.000",
  "FDY just donated Rp1.000",
  "FDY telah berdonasi sebesar IDR 1,000",
  "Donasi Masuk Dari FDY Sebesar Rp1000",
  "\nDonasi Masuk Dari FDY Sebesar 1.000\n"
];

const patterns = [
  /Donasi\s+Masuk\s+Dari\s+(.*?)\s+Sebesar\s+(?:Rp|IDR)?\s*([\d.,]+)/i,
  /(.*?)\s+just\s+donated\s+(?:Rp|IDR)\s*([\d.,]+)/i,
  /(.*?)\s+telah\s+berdonasi\s+sebesar\s+(?:Rp|IDR)\s*([\d.,]+)/i,
  /(.*?)\s+berdonasi\s+(?:Rp|IDR)\s*([\d.,]+)/i
];

for (const content of contents) {
  let matched = false;
  for (const regex of patterns) {
    const match = content.match(regex);
    if (match) {
      console.log(`Matched: ${content}`);
      console.log(`Username: ${match[1].trim()}`);
      console.log(`Amount: ${match[2].replace(/[^\d]/g, '')}`);
      matched = true;
      break;
    }
  }
  if (!matched) {
    console.log(`FAILED: ${content}`);
  }
}
