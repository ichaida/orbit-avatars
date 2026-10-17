/** Original Orbit Avatars artwork. SPDX-License-Identifier: MIT. No runtime dependencies or network requests. */
export const avatarOptions = {
  skin: ["porcelain", "sand", "honey", "copper", "umber", "ebony"],
  hair: ["crop", "curls", "coils", "waves", "bob", "braids", "bun", "bald"],
  hairColor: ["ink", "chestnut", "auburn", "gold", "silver"],
  headwear: ["none", "hijab", "turban", "beanie"],
  glasses: ["none", "round", "square"],
  outfit: ["crew", "hoodie", "collar"],
  clothing: ["iris", "teal", "blue", "marigold", "coral", "moss"],
  background: ["cream", "mint", "sky", "lilac", "rose", "peach"],
  companion: ["none", "cat", "duck", "sprout", "fox"],
  facialHair: ["none", "beard", "moustache"],
  hijabStyle: ["classic", "wrapped", "draped"],
  scarfColor: ["cream", "taupe", "rose", "blue", "sage", "lilac"],
  accessory: ["none", "crown"],
} as const;

export type AvatarTraits = {
  [K in keyof typeof avatarOptions]: (typeof avatarOptions)[K][number];
};
export type AvatarSeed = string | number;
export type AvatarOptions = Partial<AvatarTraits> & { title?: string };
export type AvatarPreset = Readonly<{
  id: string;
  name: string;
  traits: Readonly<AvatarTraits>;
}>;

const palette = {
  skin: {
    porcelain: "#F9DDC5",
    sand: "#EDBC91",
    honey: "#D99B65",
    copper: "#B87349",
    umber: "#875035",
    ebony: "#58382C",
  },
  hairColor: {
    ink: "#252323",
    chestnut: "#51372F",
    auburn: "#AB5437",
    gold: "#E2B969",
    silver: "#CEC9C4",
  },
  clothing: {
    iris: "#B8A2E0",
    teal: "#358D87",
    blue: "#3F6EC6",
    marigold: "#F3C658",
    coral: "#E88171",
    moss: "#788655",
  },
  background: {
    cream: "#FBF0CD",
    mint: "#D8EFE4",
    sky: "#D9EDF8",
    lilac: "#E9E1F5",
    rose: "#FAE0E2",
    peach: "#F8E3D6",
  },
  scarfColor: {
    cream: "#F5EBD5",
    taupe: "#B99788",
    rose: "#DDA6A1",
    blue: "#5C80BA",
    sage: "#A2B59B",
    lilac: "#C5B2D9",
  },
} as const;

// FNV-1a over UTF-16 code units: deterministic in browsers, SSR and Workers.
function hash(seed: AvatarSeed): number {
  const input = String(
    typeof seed === "number" && !Number.isFinite(seed) ? 0 : seed,
  );
  let value = 2166136261;
  for (let i = 0; i < input.length; i++)
    value = Math.imul(value ^ input.charCodeAt(i), 16777619);
  return value >>> 0;
}

/** Invalid runtime trait values fall back to the seed; arbitrary markup is never interpolated. */
export function resolveAvatar(
  seed: AvatarSeed,
  overrides: Partial<AvatarTraits> = {},
): AvatarTraits {
  let state = hash(seed);
  const result = {} as AvatarTraits;
  for (const key of Object.keys(avatarOptions) as (keyof AvatarTraits)[]) {
    state = (state + 0x6d2b79f5) | 0;
    let n = Math.imul(state ^ (state >>> 15), 1 | state);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    const choices: readonly string[] = avatarOptions[key];
    const requested = overrides[key];
    // Bias companions/headwear/facial hair toward an unadorned portrait.
    const index = (n ^ (n >>> 14)) >>> 0;
    const generated =
      ["headwear", "companion", "facialHair", "glasses", "accessory"].includes(
        key,
      ) && index % 3 !== 0
        ? choices[0]
        : choices[index % choices.length];
    Object.assign(result, {
      [key]: requested && choices.includes(requested) ? requested : generated,
    });
  }
  if (result.accessory === "crown") {
    const choseAnotherAccessory =
      overrides.accessory !== "crown" &&
      ((overrides.companion !== undefined &&
        overrides.companion !== "none" &&
        overrides.companion === result.companion) ||
        (overrides.glasses !== undefined &&
          overrides.glasses !== "none" &&
          overrides.glasses === result.glasses) ||
        ((overrides.headwear === "beanie" || overrides.headwear === "turban") &&
          overrides.headwear === result.headwear));
    if (choseAnotherAccessory) return { ...result, accessory: "none" };
    // A hijab is the base garment; hats and turbans cannot share the crown.
    return {
      ...result,
      companion: "none",
      glasses: "none",
      headwear: result.headwear === "hijab" ? "hijab" : "none",
    };
  }
  return result;
}

const archetypes: readonly Partial<AvatarTraits>[] = [
  { hair: "curls", outfit: "hoodie", companion: "cat" },
  { hair: "coils", glasses: "round", outfit: "crew" },
  { hair: "waves", companion: "cat", outfit: "crew" },
  { headwear: "hijab", companion: "duck", outfit: "hoodie" },
  { headwear: "turban", outfit: "collar" },
  { headwear: "beanie", hair: "crop", outfit: "crew" },
  { hair: "braids", glasses: "round", outfit: "crew" },
  { hair: "bun", glasses: "square", outfit: "collar" },
  { hair: "bald", facialHair: "beard", outfit: "collar" },
  { hair: "bob", hairColor: "silver", glasses: "round" },
  { hair: "waves", companion: "sprout", outfit: "hoodie" },
  { hair: "braids", companion: "fox", outfit: "collar" },
];
const names = [
  "Cloud",
  "Clover",
  "Maple",
  "Dune",
  "Indigo",
  "Harbor",
  "Cedar",
  "Juniper",
  "Ember",
  "Luna",
  "Fern",
  "Sunny",
];

/** Curated starting points assembled from original reusable vector parts. */
export const avatarPresets: readonly AvatarPreset[] = Object.freeze(
  Array.from(
    { length: avatarOptions.skin.length * archetypes.length },
    (_, i) => {
      const group = Math.floor(i / archetypes.length);
      return Object.freeze({
        id: `crew-${String(i + 1).padStart(2, "0")}`,
        name: `${names[i % names.length]} ${group + 1}`,
        traits: Object.freeze(
          resolveAvatar(i, {
            headwear: "none",
            glasses: "none",
            companion: "none",
            facialHair: "none",
            accessory: "none",
            hijabStyle: avatarOptions.hijabStyle[group % 3],
            scarfColor: avatarOptions.scarfColor[group],
            skin: avatarOptions.skin[group],
            hairColor:
              avatarOptions.hairColor[
                (i + group) % avatarOptions.hairColor.length
              ],
            clothing:
              avatarOptions.clothing[
                (i + group) % avatarOptions.clothing.length
              ],
            background:
              avatarOptions.background[
                (i + group * 2) % avatarOptions.background.length
              ],
            ...archetypes[i % archetypes.length],
          }),
        ),
      });
    },
  ),
);

export type AvatarBatchOptions = {
  /** Page size, from 1 to 200. This bounds one render batch, not the collection. */
  count?: number;
  /** Zero-based position in the seeded sequence. */
  offset?: number;
  /** Pin traits while other parts vary with the seed. */
  traits?: Partial<AvatarTraits>;
};

/** Repeatable pages independent of the curated collection; no global random state. */
export function generateAvatarBatch(
  seed: AvatarSeed,
  { count = 24, offset = 0, traits = {} }: AvatarBatchOptions = {},
): readonly AvatarPreset[] {
  if (!Number.isSafeInteger(count) || count < 1 || count > 200)
    throw new RangeError(
      "Avatar batch count must be an integer from 1 to 200.",
    );
  if (
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    !Number.isSafeInteger(offset + count)
  )
    throw new RangeError(
      "Avatar batch offset must be a nonnegative safe integer with room for the batch.",
    );
  const normalized =
    typeof seed === "number" && !Number.isFinite(seed) ? 0 : seed;
  const namespace = hash(normalized).toString(36);
  return Object.freeze(
    Array.from({ length: count }, (_, i) => {
      const position = offset + i;
      const id = `generated-${namespace}-${position}`;
      return Object.freeze({
        id,
        name: `Generated portrait ${position + 1}`,
        traits: Object.freeze(
          resolveAvatar(`${String(normalized)}:${position}`, traits),
        ),
      });
    }),
  );
}

/** Reference-led scarf studies: each silhouette has plain, cat, duck and crown versions. */
export const hijabPresets: readonly AvatarPreset[] = Object.freeze(
  avatarOptions.hijabStyle.flatMap((hijabStyle, styleIndex) =>
    ["plain", "cat", "duck", "crown"].map((version, versionIndex) =>
      Object.freeze({
        id: `hijab-${hijabStyle}-${version}`,
        name: `${hijabStyle} hijab · ${version}`,
        traits: Object.freeze(
          resolveAvatar(`hijab-${hijabStyle}-${version}`, {
            headwear: "hijab",
            hijabStyle,
            scarfColor: (["cream", "rose", "taupe", "lilac"] as const)[
              versionIndex
            ],
            skin: (["umber", "sand", "honey", "copper"] as const)[
              (versionIndex + styleIndex) % 4
            ],
            clothing: (["teal", "blue", "blue", "iris"] as const)[versionIndex],
            background: (["lilac", "cream", "lilac", "sky"] as const)[
              versionIndex
            ],
            outfit: "crew",
            hair: "bald",
            hairColor: "ink",
            glasses: "none",
            facialHair: "none",
            companion:
              version === "cat" || version === "duck" ? version : "none",
            accessory: version === "crown" ? "crown" : "none",
          }),
        ),
      }),
    ),
  ),
);

const ink = "#262323";
const path = (d: string, fill = "none", extra = "") =>
  `<path d="${d}" fill="${fill}" ${extra}/>`;
const ellipse = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
const escapeXml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );

function hairBack(t: AvatarTraits, color: string): string {
  if (t.headwear === "hijab" || t.headwear === "turban") return "";
  switch (t.hair) {
    case "waves":
      return path(
        "M35 41C22 47 31 57 23 67S29 81 23 89C18 104 32 111 45 103L84 104C100 99 93 87 95 80C101 65 88 61 91 48C88 22 44 19 35 41Z",
        color,
      );
    case "bob":
      return path("M32 58C25 16 90 17 89 57L94 91Q61 105 27 91Z", color);
    case "braids":
      return [35, 83]
        .map(
          (x) =>
            `<g>${[61, 70, 79, 88, 97].map((y, i) => ellipse(x + (i % 2 ? 2 : 0), y, 6, 7, color)).join("")}${path(`M${x - 4} 102h9`, "none")}</g>`,
        )
        .join("");
    default:
      return "";
  }
}

function hairFront(t: AvatarTraits, color: string): string {
  if (t.headwear === "hijab" || t.headwear === "turban") return "";
  switch (t.hair) {
    case "bald":
      return "";
    case "coils":
    case "curls": {
      const coils = t.hair === "coils";
      // One scalloped ink silhouette, rather than individually outlined circles.
      // It keeps the soft curls in the reference without a ringlet/helmet grid.
      return path(
        coils
          ? "M32 70Q22 70 24 61Q15 57 20 48Q14 39 24 35Q20 25 31 24Q34 14 44 20Q50 11 58 19Q68 12 74 22Q85 17 88 29Q99 29 96 40Q104 47 97 55Q100 65 88 69L78 75Q73 71 75 61Q69 59 70 49Q59 52 53 43Q48 53 38 49L37 64Z"
          : "M32 71Q22 73 24 63Q15 59 20 51Q11 44 21 38Q17 28 28 27Q27 17 39 23Q44 13 53 21Q62 13 69 23Q80 17 83 29Q95 26 93 39Q103 44 95 53Q100 64 87 67L78 75Q72 73 75 62Q66 61 71 50Q62 54 57 43Q49 53 39 49L37 63Z",
        color,
      );
    }
    case "waves":
      return (
        path(
          "M34 60C25 36 41 24 58 25C71 22 90 32 85 51L76 59Q66 51 65 37Q58 53 38 49L38 62Z",
          color,
        ) +
        path(
          "M47 32q-11 4-10 14M73 34q8 5 5 14",
          "none",
          'stroke="#FFFFFF" stroke-opacity=".15"',
        )
      );
    case "bob":
      return path(
        "M32 61C26 31 47 24 61 26C82 24 91 44 85 67L76 59L72 43Q57 52 38 47L38 63Z",
        color,
      );
    case "bun":
      return (
        ellipse(77, 24, 14, 13, color) +
        path(
          "M32 60C24 36 44 26 58 27C80 24 91 42 84 63L75 54L72 41Q54 48 38 47L38 62Z",
          color,
        ) +
        path(
          "M73 16q-4 7 3 12",
          "none",
          'stroke="#FFFFFF" stroke-opacity=".18"',
        )
      );
    case "braids":
      return (
        path(
          "M31 59C25 19 89 18 88 59L76 54L71 39L62 46L53 38L39 52L38 64Z",
          color,
        ) +
        path(
          "M60 28v12M47 30l-7 13M73 31l6 12",
          "none",
          'stroke="#FFFFFF" stroke-opacity=".2"',
        )
      );
    case "crop":
      return path(
        "M33 61L29 46L34 38L32 32L44 32L49 25L60 29L71 25L78 32L87 34L85 45L82 57L76 52L73 42Q54 49 37 47L38 62Z",
        color,
      );
  }
}

function companion(kind: AvatarTraits["companion"], darkCat = false): string {
  switch (kind) {
    case "none":
      return "";
    case "sprout":
      return (
        path("M62 29V15", "none") +
        path("M62 22Q43 22 47 12Q60 10 62 22Z", "#8BAF67") +
        path("M62 18Q64 5 77 10Q78 21 62 23Z", "#A8C77E")
      );
    case "duck":
      return (
        path(
          "M53 25Q44 22 49 16Q50 12 55 15C50 4 65 3 66 12Q67 17 62 19L73 18Q79 31 61 32Q54 32 53 25Z",
          "#F2CC62",
        ) +
        path("M64 13l7 3-7 2", "#DA8A42") +
        ellipse(60, 12, 0.9, 1.1, ink)
      );
    case "fox":
      return (
        path(
          "M45 29Q36 27 36 20L41 13L48 18L58 13L63 20Q76 15 84 25Q89 36 73 35L59 30Z",
          "#D88145",
        ) +
        path("M40 22q8 15 19 1l-5 9-10-1Z", "#FFF1DA") +
        path("M73 24q12 0 10 7l-8 1", "#FFF1DA") +
        path("M43 23l2 1m8-1 2-1") +
        ellipse(49, 28, 1, 0.8, ink)
      );
    case "cat":
      return (
        path(
          "M47 29Q35 29 37 20L39 11L47 16L55 15L62 9L65 20Q71 20 73 25Q86 29 86 18Q83 13 86 13Q93 17 89 26Q86 34 68 31Z",
          darkCat ? "#292726" : "#A7A3A0",
        ) +
        (darkCat
          ? `<g stroke="none">${ellipse(44, 23, 0.9, 0.9, "#D9B66D")}${ellipse(56, 22, 0.9, 0.9, "#D9B66D")}</g>`
          : path("M42 18l2 6 7 2 6-8 4 10q-10 6-19 0Z", "#F9F4EB") +
            path("M43 23l2 1m10-2 2-1M48 27h2", "none")) +
        path("M66 24l5 3M77 27l2 4")
      );
  }
}

function hijabPortrait(t: AvatarTraits, id: string, skin: string): string {
  const scarf = palette.scarfColor[t.scarfColor];
  // A single exposed-face contour is shared by the portrait and the scarf hole.
  // Every fabric seam is clipped to the scarf, so it cannot cross the face.
  const face =
    "M48 36C40 39 35 49 35 61C35 74 42 83 54 84C64 79 69 70 68 58C63 48 56 40 48 36Z";
  const styles = {
    classic: {
      outline:
        "M58 24C79 24 91 40 91 59Q92 75 81 88L90 98Q66 117 37 100L29 83Q24 68 28 50C31 33 42 24 58 24Z",
      folds:
        "M75 40Q90 66 72 84M31 81Q46 99 77 86M38 99Q58 108 82 96M61 102L63 120M76 102L79 120",
    },
    wrapped: {
      outline:
        "M58 24C79 23 91 40 91 58Q92 74 81 85L95 93Q84 112 53 109L32 96L28 78Q24 62 29 46C34 30 43 24 58 24Z",
      folds:
        "M75 40Q90 64 73 81M28 78Q46 98 81 83M33 92Q64 105 88 91M48 105Q67 113 86 101",
    },
    draped: {
      outline:
        "M58 24C81 24 92 41 91 62L89 80Q91 99 101 117L70 125L31 119Q33 100 27 80C22 62 26 42 37 32Q46 24 58 24Z",
      folds:
        "M76 42Q91 70 74 85M28 81Q47 99 79 86M34 94Q52 109 84 94M42 104L39 121M77 101L85 122",
    },
  };
  const { outline, folds } = styles[t.hijabStyle];
  const fabric = `${outline}${face}`;
  return `<g data-layer="hijab"><defs><clipPath id="${id}-fabric"><path d="${fabric}" clip-rule="evenodd"/></clipPath></defs>${path(face, skin)}${path(fabric, scarf, 'fill-rule="evenodd"')}<g data-layer="scarf-folds" clip-path="url(#${id}-fabric)">${path(folds, "none", 'stroke-width="1.9"')}</g><g data-layer="hijab-features" stroke="none">${ellipse(43, 60, 1.55, 2.5, ink)}${ellipse(55, 61, 1.55, 2.5, ink)}${path("M49 64l-1.5 5h2.5", "none", `stroke="${ink}" stroke-width="1.4" stroke-opacity=".55"`)}${path("M46 75q4 2 8-1", "none", `stroke="${ink}" stroke-width="1.7"`)}</g></g>`;
}

function crown(): string {
  return `<g data-layer="crown">${path("M43 26L39 10L50 17L59 5L68 17L80 10L75 28Q59 33 43 26Z", "#F0C85E")}${path("M44 26Q59 30 74 27", "none", 'stroke-width="1.5"')}${ellipse(59, 22, 2.2, 2.8, "#D98A76")}</g>`;
}

/** Return a complete standalone SVG, with a fixed viewBox and circular crop. */
export function createAvatarSvg(
  seed: AvatarSeed,
  options: AvatarOptions = {},
): string {
  const t = resolveAvatar(seed, options);
  const skin = palette.skin[t.skin],
    hair = palette.hairColor[t.hairColor];
  const cloth = palette.clothing[t.clothing],
    background = palette.background[t.background];
  const id = `oc-${hash(JSON.stringify(t))}`;
  const title = options.title
    ? `<title>${escapeXml(options.title)}</title>`
    : "";
  const back = hairBack(t, hair);
  const body = path(
    "M18 124L21 107Q24 94 46 92L72 92Q95 96 101 111L104 124Z",
    cloth,
  );
  const shirt =
    t.outfit === "hoodie"
      ? path(
          "M45 91L34 94L42 107L56 101L70 108L83 95L70 90Q61 99 56 100Z",
          cloth,
        ) + path("M56 102v23M43 108v10M71 110v8")
      : t.outfit === "collar"
        ? path("M46 91L38 95L44 108L56 100L65 108L77 94L70 90L57 100Z", cloth) +
          path("M56 101v24") +
          ellipse(61, 115, 0.8, 0.8, ink)
        : path("M41 94Q57 116 77 95M38 97Q54 118 78 99");
  const face = path(
    "M36 54C34 37 46 32 58 33C76 30 82 43 79 61Q87 58 86 66Q85 73 78 73Q75 85 66 87L67 94Q59 102 49 94L49 83Q35 80 36 65Z",
    skin,
  );
  const features = `<g data-layer="face-features" stroke="none">${ellipse(47, 61, 1.65, 2.65, ink)}${ellipse(60, 60, 1.65, 2.65, ink)}${path("M54 64l-2 6h4", "none", `stroke="${ink}" stroke-width="1.4" stroke-opacity=".55"`)}${path("M52 77q5 3 9-1", "none", `stroke="${ink}" stroke-width="1.7"`)}${path("M80 65l-1 4", "none", `stroke="${ink}" stroke-width="1.4"`)}</g>`;
  const facialHair =
    t.facialHair === "beard"
      ? path(
          "M38 70Q43 77 49 72Q56 69 63 72Q71 78 77 71Q77 88 62 90Q42 89 38 70Z",
          hair,
        ) +
        path("M52 77q5 3 9-1", "none", `stroke="${skin}" stroke-width="1.7"`)
      : t.facialHair === "moustache"
        ? path("M56 72Q49 68 46 76Q52 79 56 75Q61 78 66 74Q61 68 56 72Z", hair)
        : "";
  const front = hairFront(t, hair);
  const headwear =
    t.headwear === "hijab"
      ? hijabPortrait(t, id, skin)
      : t.headwear === "turban"
        ? path(
            "M32 57Q21 33 42 25Q63 14 82 33Q94 43 82 58L75 48Q61 40 42 39L37 60Z",
            cloth,
          ) + path("M35 31q25 4 46 20M47 25q26 7 37 19M33 40q14-1 29 6")
        : t.headwear === "beanie"
          ? path("M29 44Q29 17 56 18Q81 17 85 42L87 48L30 53Z", cloth) +
            path("M29 43Q54 37 84 42L86 52Q58 46 30 54Z", cloth) +
            path(
              "M39 28l-3 10M49 24l-2 12M60 23v12M70 27l2 10",
              "none",
              'stroke-opacity=".3" stroke-width="1.4"',
            )
          : "";
  const glasses =
    t.glasses === "round"
      ? ellipse(46, 61, 8, 8, "none") +
        ellipse(65, 60, 8, 8, "none") +
        path("M54 60h3M73 59l6-2")
      : t.glasses === "square"
        ? path(
            "M38 54l15-1 1 13-15 1ZM58 53l15-1 1 13-15 1ZM54 58h4M74 56l5-1",
            "none",
          )
        : "";
  const portrait =
    t.headwear === "hijab"
      ? headwear
      : `${face}${features}${facialHair}${front}${headwear}`;
  const friend =
    t.companion === "none"
      ? ""
      : `<g data-layer="companion">${companion(t.companion, t.hair === "waves")}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" ${title ? 'role="img"' : 'aria-hidden="true"'}>${title}<defs><clipPath id="${id}"><circle cx="60" cy="60" r="60"/></clipPath></defs><g clip-path="url(#${id})"><path d="M0 0h120v120H0z" fill="${background}"/><g stroke="${ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${back}${body}${shirt}${portrait}${glasses ? `<g data-layer="glasses">${glasses}</g>` : ""}${t.accessory === "crown" ? crown() : ""}${friend}</g></g></svg>`;
}

/** Safe for img.src, CSS backgrounds and map marker elements. */
export function createAvatarDataUri(
  seed: AvatarSeed,
  options: AvatarOptions = {},
): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(createAvatarSvg(seed, options))}`;
}
