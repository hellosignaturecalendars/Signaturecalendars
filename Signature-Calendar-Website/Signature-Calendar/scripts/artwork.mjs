import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("public/art", { recursive: true });
const leaf = (x, y, r, s = 1, color = "#637d54") =>
  `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0 Q-65-45 0-155 Q65-45 0 0" fill="${color}"/><path d="M0-2V-140" stroke="#e5ebd7" stroke-width="1.2" opacity=".65"/></g>`;
let leaves = "";
for (let i = 0; i < 11; i++) {
  let x = 315 + (i % 3) * 60,
    y = 175 + Math.floor(i / 3) * 44;
  leaves += leaf(
    x,
    y,
    -55 + i * 18,
    0.45 + (i % 3) * 0.15,
    ["#506f48", "#849568", "#aab891"][i % 3],
  );
}
const wrap = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#fbfaf2"/>${body}</svg>`;
writeFileSync(
  "public/art/botanical.svg",
  wrap(
    600,
    390,
    `<rect x="258" y="0" width="342" height="328" fill="#e8ecdc"/><circle cx="470" cy="135" r="170" fill="#dde4cc"/>${leaves}<path d="M375 330Q375 220 430 90M380 300Q350 200 295 145M380 275Q470 200 528 180" fill="none" stroke="#6b8054" stroke-width="3"/><text x="33" y="48" font-family="Arial" font-size="9" letter-spacing="3" fill="#647459">BOTANICAL STUDIES</text><text x="30" y="125" font-family="Georgia" font-size="42" fill="#3a5039">A little</text><text x="30" y="176" font-family="Georgia" font-size="42" font-style="italic" fill="#3a5039">everyday.</text><text x="33" y="250" font-family="Arial" font-size="10" letter-spacing="2" fill="#78806b">ROOM TO GROW.</text><text x="33" y="291" font-family="Georgia" font-size="28" fill="#4b6043">2027</text><path d="M25 337H575" stroke="#d7dccd"/><text x="30" y="365" font-family="Arial" font-size="10" letter-spacing="2" fill="#728063">YOUR BRAND, ALL YEAR LONG</text><text x="536" y="365" font-family="Georgia" font-size="14" fill="#647459">sc.</text>`,
  ),
);
writeFileSync(
  "public/art/architecture.svg",
  wrap(
    360,
    470,
    `<rect width="360" height="330" fill="#dfceba"/><rect x="45" y="40" width="230" height="310" rx="115" fill="#be8b68"/><path d="M82 330V164a78 78 0 0 1 156 0v166" fill="#eadbc6"/><path d="M117 330V176a44 44 0 0 1 88 0v154" fill="#a87551"/><path d="M0 295L360 248V340H0" fill="#c8b59c"/><path d="M155 310L310 275L345 287L197 331" fill="#f3e9d7"/><text x="24" y="372" font-family="Arial" font-size="8" letter-spacing="2" fill="#8b6c52">ARCHITECTURAL NOTES</text><text x="24" y="408" font-family="Georgia" font-size="28" fill="#624f3c">A different perspective.</text><text x="24" y="445" font-family="Arial" font-size="9" letter-spacing="2" fill="#8b6c52">YOUR BRAND · 2027</text>`,
  ),
);
writeFileSync(
  "public/art/landscape.svg",
  wrap(
    600,
    390,
    `<rect width="600" height="295" fill="#dfe5df"/><circle cx="437" cy="83" r="37" fill="#f8f3d9"/><path d="M0 209Q95 81 210 167T420 158T600 135V310H0" fill="#9fab94"/><path d="M0 218Q113 176 238 221T440 208T600 203V310H0" fill="#788e77"/><path d="M0 282Q180 189 360 274T600 245V310H0" fill="#4f7060"/><path d="M320 226Q200 265 315 295H362Q252 262 335 226" fill="#c4cfb7"/><text x="28" y="334" font-family="Arial" font-size="8" letter-spacing="2" fill="#69806a">QUIET LANDSCAPES</text><text x="27" y="369" font-family="Georgia" font-size="28" fill="#355641">A moment of calm.</text><text x="493" y="368" font-family="Georgia" font-size="25" fill="#355641">2027</text>`,
  ),
);
let dates = "";
for (let i = 0; i < 7; i++)
  dates += `<text x="${303 + i * 39}" y="113" font-family="Arial" font-size="8" fill="#8a927e">${["M", "T", "W", "T", "F", "S", "S"][i]}</text>`;
for (let d = 1; d <= 31; d++) {
  const cell = d + 3;
  dates += `<text x="${303 + (cell % 7) * 39}" y="${143 + Math.floor(cell / 7) * 30}" font-family="Arial" font-size="11" fill="#44523c">${d}</text>`;
}
writeFileSync(
  "public/art/month.svg",
  wrap(
    600,
    390,
    `<rect width="260" height="328" fill="#e8ecdc"/>${leaf(125, 260, -30, 1.2)}${leaf(120, 245, 40, 0.85, "#91a17a")}${leaf(140, 280, 10, 0.7, "#aebb95")}<text x="296" y="60" font-family="Georgia" font-size="28" fill="#43563a">January</text><text x="515" y="60" font-family="Arial" font-size="12" fill="#7d886e">2027</text>${dates}<path d="M25 337H575" stroke="#d7dccd"/><text x="30" y="365" font-family="Arial" font-size="10" letter-spacing="2" fill="#728063">YOUR BRAND, ALL YEAR LONG</text><text x="539" y="365" font-family="Georgia" font-size="14" fill="#647459">sc.</text>`,
  ),
);
