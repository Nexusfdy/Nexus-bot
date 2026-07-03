let content = `Fulan telah berdonasi sebesar Rp10.000`;
const m1 = content.match(/(.*?)\s+just\s+donated\s+(?:Rp|IDR)\s*([\d.,]+)/i);
const m2 = content.match(/(.*?)\s+telah\s+berdonasi\s+sebesar\s+(?:Rp|IDR)\s*([\d.,]+)/i);
const m3 = content.match(/(.*?)\s+berdonasi\s+(?:Rp|IDR)\s*([\d.,]+)/i);
console.log(m1 ? m1[1] : null);
console.log(m2 ? m2[1] : null);
console.log(m3 ? m3[1] : null);
