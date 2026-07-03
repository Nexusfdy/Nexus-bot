let contentToParse = "";
contentToParse += `\nNew Donation!\nFulan just donated Rp10.000`;
contentToParse = contentToParse.replace(/\*/g, '').replace(/_/g, '');
const saweriaMatch = contentToParse.match(/(.*?)\s+just\s+donated\s+(?:Rp|IDR)\s*([\d.,]+)/i);
console.log(saweriaMatch ? saweriaMatch[1].trim() : 'null');
