import { createAvatarDataUri } from "../src/index.ts";
for (const [i, accessory] of [
  "headphones",
  "flower",
  "bow",
  "star",
].entries()) {
  const img = new Image(120, 120);
  img.src = createAvatarDataUri(`release-${i}`, {
    headwear: "hijab",
    hijabStyle: "classic",
    scarfColor: ["cream", "rose", "sage", "lilac"][i],
    skin: ["honey", "umber", "sand", "copper"][i],
    glasses: "square",
    accessory,
    companion: "none",
    background: ["lilac", "cream", "sky", "mint"][i],
  });
  img.alt = `Hijab portrait with square glasses and ${accessory === "star" ? "star pin" : accessory}`;
  document.getElementById("release-art").append(img);
}
