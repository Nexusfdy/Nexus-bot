let contentToParse = `\nSomeone just donated!\nFulan just donated Rp10.000`;
const match = contentToParse.match(/(.*?)\s+just\s+donated\s+(?:Rp|IDR)\s*([\d.,]+)/i);
console.log(match ? match[1].trim() : "no match");
