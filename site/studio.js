import {
  avatarOptions,
  avatarPresets,
  hijabPresets,
  generateAvatarBatch,
  resolveAvatar,
  createAvatarDataUri,
  createAvatarSvg,
} from "../src/index.ts";
const $ = (id) => document.getElementById(id);
let seed = "hello-orbit",
  traits = resolveAvatar(seed, {
    headwear: "hijab",
    hijabStyle: "classic",
    scarfColor: "cream",
    skin: "honey",
    glasses: "square",
    accessory: "none",
    companion: "none",
    clothing: "blue",
    background: "lilac",
  }),
  selected = null;
let source = "curated",
  activeFilter = "All",
  batch = 0;
const label = (key) =>
  ({
    hairColor: "Hair color",
    facialHair: "Facial hair",
    hijabStyle: "Hijab style",
    scarfColor: "Scarf color",
  })[key] || key[0].toUpperCase() + key.slice(1);
let activeGroup = "face";
const groups = {
  face: ["skin", "hair", "hairColor", "facialHair", "glasses"],
  style: [
    "headwear",
    "hijabStyle",
    "scarfColor",
    "outfit",
    "clothing",
    "background",
  ],
  extras: ["accessory", "companion"],
};
const selects = new Map();
const fields = new Map();
for (const [key, values] of Object.entries(avatarOptions)) {
  const field = document.createElement("label");
  field.textContent = label(key);
  const select = document.createElement("select");
  select.id = `trait-${key}`;
  select.setAttribute("aria-label", label(key));
  for (const value of values) select.add(new Option(value, value));
  select.addEventListener("change", () => {
    traits[key] = select.value;
    if (
      ((key === "companion" || key === "glasses") && select.value !== "none") ||
      (key === "headwear" &&
        (select.value === "beanie" || select.value === "turban"))
    )
      if (key !== "glasses" || traits.accessory === "crown")
        traits.accessory = "none";
    selected = null;
    update();
  });
  field.append(select);
  $("controls").append(field);
  selects.set(key, select);
  fields.set(key, field);
}
const hero = [0, 13, 27, 40, 59];
for (const i of hero) {
  const img = new Image();
  img.src = createAvatarDataUri(i, avatarPresets[i].traits);
  img.alt = "";
  $("hero-faces").append(img);
}
for (const size of [24, 36, 48]) {
  const img = new Image(size, size);
  img.alt = `${size} pixel avatar preview`;
  $("sizes").append(img);
}
function update() {
  traits = resolveAvatar(seed, traits);
  const uri = createAvatarDataUri(seed, traits);
  $("portrait").src = uri;
  for (const img of $("sizes").children) img.src = uri;
  for (const [key, select] of selects) select.value = traits[key];
  for (const [key, field] of fields) {
    field.hidden =
      !groups[activeGroup].includes(key) ||
      (["hijabStyle", "scarfColor"].includes(key) &&
        traits.headwear !== "hijab") ||
      (["hair", "hairColor", "facialHair"].includes(key) &&
        traits.headwear === "hijab");
  }
  $("live-code").textContent =
    `import { CrewAvatar } from 'orbit-avatars/react';\n\n<CrewAvatar\n  seed=${JSON.stringify(seed)}\n  size={48}\n  options={${JSON.stringify(traits, null, 2)}}\n/>`;
  for (const button of $("gallery").children)
    button.setAttribute("aria-pressed", String(button.dataset.id === selected));
  $("status").textContent =
    traits.accessory === "crown"
      ? "Crowns are worn alone. Choosing another accessory replaces the crown."
      : traits.accessory !== "none"
        ? "Head accessories replace hats and companions. Glasses can stay."
        : "Your avatar is generated locally. Ready to make it yours.";
}
function gallery(filter = activeFilter) {
  activeFilter = filter;
  $("gallery").replaceChildren();
  const constraints = {
    Curls: { hair: "curls", headwear: "none" },
    Headwear: { headwear: "beanie" },
    Hijabs: { headwear: "hijab", facialHair: "none" },
    Crowns: { accessory: "crown" },
    Glasses: { glasses: "round" },
    Companions: { companion: "cat" },
    Accessories: { accessory: "flower" },
  };
  const candidates =
    source === "generated"
      ? generateAvatarBatch("orbit-crew-explore", {
          count: 24,
          offset: batch * 24,
          traits: constraints[filter] || {},
        })
      : [
          ...avatarPresets,
          ...hijabPresets,
          ...["headphones", "flower", "bow", "star"].flatMap((accessory, i) =>
            ["none", "hijab"].map((headwear, j) => ({
              id: `extra-${accessory}-${headwear}`,
              name: `${accessory} ${j ? "hijab" : "portrait"}`,
              traits: resolveAvatar(`extra-${i}-${j}`, {
                headwear,
                accessory,
                glasses: j ? "square" : "none",
                companion: "none",
                hijabStyle: "wrapped",
              }),
            })),
          ),
        ];
  const matches = candidates.filter(
    (p) =>
      filter === "All" ||
      (filter === "Curls" && ["curls", "coils"].includes(p.traits.hair)) ||
      (filter === "Headwear" && p.traits.headwear !== "none") ||
      (filter === "Hijabs" && p.traits.headwear === "hijab") ||
      (filter === "Crowns" && p.traits.accessory === "crown") ||
      (filter === "Glasses" && p.traits.glasses !== "none") ||
      (filter === "Companions" && p.traits.companion !== "none") ||
      (filter === "Accessories" && p.traits.accessory !== "none"),
  );
  $("count").textContent = `${matches.length} shown`;
  $("batch-controls").hidden = source !== "generated";
  $("previous-batch").disabled = batch === 0;
  $("collection-status").textContent =
    source === "generated"
      ? `Generated batch ${batch + 1}. Keep exploring or select a portrait to customize.`
      : "These portraits are starting points. Explore generated combinations or customize any face.";
  for (const preset of matches) {
    const button = document.createElement("button");
    button.className = "preset";
    button.dataset.id = preset.id;
    button.setAttribute("aria-label", `Customize ${preset.name}`);
    const img = new Image(120, 120);
    img.src = createAvatarDataUri(preset.id, preset.traits);
    img.alt = "";
    img.loading = "lazy";
    const caption = document.createElement("span");
    caption.className = "index";
    caption.textContent =
      source === "generated"
        ? preset.name
        : preset.id.startsWith("hijab-") || preset.id.startsWith("extra-")
          ? preset.name
          : preset.id;
    button.append(img, caption);
    button.onclick = () => {
      seed = preset.id;
      $("seed").value = seed;
      traits = { ...preset.traits };
      selected = preset.id;
      update();
      $("studio").scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
    };
    $("gallery").append(button);
  }
  update();
}
for (const name of [
  "All",
  "Curls",
  "Headwear",
  "Hijabs",
  "Crowns",
  "Glasses",
  "Companions",
  "Accessories",
]) {
  const button = document.createElement("button");
  button.textContent = name;
  button.setAttribute("aria-pressed", String(name === "All"));
  button.onclick = () => {
    for (const b of $("filters").children)
      b.setAttribute("aria-pressed", String(b === button));
    batch = 0;
    selected = null;
    gallery(name);
  };
  $("filters").append(button);
}
for (const mode of ["curated", "generated"]) {
  $(mode).onclick = () => {
    source = mode;
    batch = 0;
    selected = null;
    for (const item of ["curated", "generated"])
      $(item).setAttribute("aria-pressed", String(mode === item));
    gallery();
  };
}
$("previous-batch").onclick = () => {
  if (batch > 0) batch--;
  selected = null;
  gallery();
};
$("next-batch").onclick = () => {
  batch++;
  selected = null;
  gallery();
};
$("seed").oninput = () => {
  seed = $("seed").value;
  traits = resolveAvatar(seed);
  selected = null;
  update();
};
$("shuffle").onclick = () => {
  seed = `crew-${crypto.getRandomValues(new Uint32Array(1))[0]}`;
  $("seed").value = seed;
  traits = resolveAvatar(seed);
  selected = null;
  update();
};
$("download").onclick = () => {
  const url = URL.createObjectURL(
    new Blob(
      [
        createAvatarSvg(seed, {
          ...traits,
          title: "Orbit Avatars avatar",
        }),
      ],
      { type: "image/svg+xml" },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "orbit-avatar.svg";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("status").textContent = "SVG downloaded.";
};
$("copy").onclick = async () => {
  try {
    await navigator.clipboard.writeText(
      `<CrewAvatar seed={${JSON.stringify(seed)}} options={${JSON.stringify(traits)}} size={40} />`,
    );
    $("status").textContent = "React props copied.";
  } catch {
    $("status").textContent =
      "Clipboard unavailable in this browser. Use the package README example.";
  }
};
for (const button of document.querySelectorAll("[data-group]"))
  button.onclick = () => {
    activeGroup = button.dataset.group;
    for (const item of document.querySelectorAll("[data-group]"))
      item.setAttribute("aria-pressed", String(item === button));
    update();
  };
$("copy-install").onclick = async () => {
  try {
    await navigator.clipboard.writeText("npm install orbit-avatars");
    $("copy-install").textContent = "Copied!";
  } catch {
    $("copy-install").textContent = "Select the command to copy";
  }
};
gallery();
