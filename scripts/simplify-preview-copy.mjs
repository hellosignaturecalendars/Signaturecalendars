import { readFileSync, writeFileSync, existsSync } from "node:fs";
// Update only the original local sample copy, preserving any owner-customized fields.
const file = ".data/preview.json";
if (existsSync(file)) {
  const data = JSON.parse(readFileSync(file, "utf8"));
  const replacements = {
    title: [
      "A whole year.\nA lasting impression.",
      "Personalized calendars.\nMade for your brand.",
    ],
    primaryLabel: ["Explore designs", "Browse Calendar Designs"],
    secondaryLabel: ["Request a quote", "Contact Us"],
    collectionsTitle: [
      "Find your kind of everyday.",
      "Choose your calendar design.",
    ],
  };
  for (const version of ["draft", "published"])
    for (const [key, [before, after]] of Object.entries(replacements))
      if (data[version]?.home?.[key] === before)
        data[version].home[key] = after;
  writeFileSync(file, JSON.stringify(data, null, 2));
}
