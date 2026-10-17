import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Window } from "happy-dom";
import {
  avatarOptions,
  avatarPresets,
  hijabPresets,
  generateAvatarBatch,
  createAvatarSvg,
  createAvatarDataUri,
  resolveAvatar,
  type AvatarOptions,
} from "../src/index";
import { CrewAvatar } from "../src/react";

test("curated presets remain extensible and preserve their original IDs", async () => {
  const window = new Window();
  try {
    expect(avatarPresets.length).toBeGreaterThanOrEqual(72);
    expect(avatarPresets[0].id).toBe("crew-01");
    expect(avatarPresets[71].id).toBe("crew-72");
    expect(new Set(avatarPresets.map((p) => p.id)).size).toBe(
      avatarPresets.length,
    );
    expect(
      new Set(avatarPresets.map((p) => createAvatarSvg(p.id, p.traits))).size,
    ).toBe(avatarPresets.length);
    for (const [key, values] of Object.entries(avatarOptions)) {
      const present = new Set(
        avatarPresets.map((p) => p.traits[key as keyof typeof p.traits]),
      );
      // Presets intentionally favor specific archetypes. Unrepresented options
      // remain directly selectable and are checked in the renderer loop below.
      if (
        key === "skin" ||
        key === "headwear" ||
        key === "glasses" ||
        key === "companion"
      )
        for (const value of values)
          expect(present.has(value as never)).toBe(true);
      for (const value of values) {
        const svg = createAvatarSvg("coverage", { [key]: value });
        const doc = new window.DOMParser().parseFromString(
          svg,
          "image/svg+xml",
        );
        expect(doc.querySelector("parsererror")).toBeNull();
        expect(doc.documentElement.getAttribute("viewBox")).toBe("0 0 120 120");
        expect(svg).not.toMatch(
          /undefined|NaN|<script|<image|https?:\/\/(?!www.w3.org)/,
        );
      }
    }
  } finally {
    await window.happyDOM.close();
  }
});

test("generated pages extend beyond curated portraits and preserve constrained traits", () => {
  const page = generateAvatarBatch("our-crew", {
    offset: 1200,
    count: 24,
    traits: { headwear: "hijab", accessory: "crown" },
  });
  expect(page).toHaveLength(24);
  expect(page).toEqual(
    generateAvatarBatch("our-crew", {
      offset: 1200,
      count: 24,
      traits: { headwear: "hijab", accessory: "crown" },
    }),
  );
  expect(
    page.every(
      (p) => p.traits.headwear === "hijab" && p.traits.accessory === "crown",
    ),
  ).toBe(true);
  expect(new Set(page.map((p) => p.traits.skin)).size).toBeGreaterThan(1);
  expect(Object.isFrozen(page[0].traits)).toBe(true);
  const first = generateAvatarBatch("pages", { count: 24 });
  const second = generateAvatarBatch("pages", { count: 24, offset: 24 });
  expect(new Set([...first, ...second].map((p) => p.id)).size).toBe(48);
  expect([...first, ...second]).toEqual([
    ...generateAvatarBatch("pages", { count: 48 }),
  ]);
  expect(second).not.toEqual(
    generateAvatarBatch("another-crew", { count: 24, offset: 24 }),
  );
  for (const options of [
    { count: 0 },
    { count: 201 },
    { count: 1.5 },
    { offset: -1 },
    { offset: Infinity },
    { offset: Number.MAX_SAFE_INTEGER },
  ])
    expect(() => generateAvatarBatch("invalid", options)).toThrow(RangeError);
});

test("seeded portraits are deterministic with independent explicit overrides", () => {
  const first = createAvatarSvg("project-a:opaque-id");
  expect(first).toBe(createAvatarSvg("project-a:opaque-id"));
  expect(first).not.toBe(createAvatarSvg("project-b:opaque-id"));
  expect(createAvatarSvg(NaN)).toBe(createAvatarSvg(0));
  expect(createAvatarSvg(Infinity)).toBe(createAvatarSvg(0));
  const original = resolveAvatar("stable");
  expect(resolveAvatar("stable", { companion: "duck" })).toEqual({
    ...original,
    companion: "duck",
  });
  expect(Object.isFrozen(avatarPresets[0].traits)).toBe(true);
  expect(createAvatarSvg("日本語 🌱")).toBe(createAvatarSvg("日本語 🌱"));
});

test("untrusted seeds, titles and runtime options cannot inject SVG markup or resource URLs", async () => {
  const attack =
    '\"><script>alert(1)</script><image href="https://evil.invalid"/>';
  const svg = createAvatarSvg(attack, {
    title: attack,
    clothing: attack,
    hair: "__proto__",
    companion: "constructor",
  } as unknown as AvatarOptions);
  const window = new Window();
  try {
    const doc = new window.DOMParser().parseFromString(svg, "image/svg+xml");
    expect(doc.querySelector("title")!.textContent).toBe(attack);
    expect(doc.querySelector("script, image, foreignObject")).toBeNull();
    expect(svg).not.toContain('fill="undefined"');
    expect(createAvatarSvg(attack)).not.toContain(attack);
    expect(decodeURIComponent(createAvatarDataUri(attack).split(",")[1])).toBe(
      createAvatarSvg(attack),
    );
  } finally {
    await window.happyDOM.close();
  }
});

test("React SSR uses the core artwork and supports decorative and labelled avatars", async () => {
  const window = new Window();
  try {
    const div = window.document.createElement("div");
    div.innerHTML = renderToStaticMarkup(
      <CrewAvatar seed="stable" options={{ companion: "cat" }} size={64} />,
    );
    const image = div.querySelector("img")!;
    expect(image.getAttribute("src")).toBe(
      createAvatarDataUri("stable", { companion: "cat" }),
    );
    expect(image.width).toBe(64);
    expect(image.height).toBe(64);
    expect(image.getAttribute("aria-hidden")).toBe("true");
    div.innerHTML = renderToStaticMarkup(
      <CrewAvatar
        seed="stable"
        alt="Your chosen avatar"
        className="profile-picture"
      />,
    );
    expect(div.querySelector("img")!.hasAttribute("aria-hidden")).toBe(false);
    expect(div.querySelector("img")!.alt).toBe("Your chosen avatar");
  } finally {
    await window.happyDOM.close();
  }
});

test("hijab variants keep all fabric seams outside the exposed face", async () => {
  const window = new Window();
  try {
    expect(hijabPresets).toHaveLength(12);
    expect(new Set(hijabPresets.map((p) => p.id)).size).toBe(12);
    for (const hijabStyle of avatarOptions.hijabStyle) {
      const variants = hijabPresets.filter(
        (p) => p.traits.hijabStyle === hijabStyle,
      );
      expect(variants).toHaveLength(4);
      expect(variants.some((p) => p.traits.accessory === "crown")).toBe(true);
      for (const preset of variants) {
        const svg = createAvatarSvg(preset.id, preset.traits);
        const doc = new window.DOMParser().parseFromString(
          svg,
          "image/svg+xml",
        );
        expect(doc.querySelector("parsererror")).toBeNull();
        const portrait = doc.querySelector('[data-layer="hijab"]')!;
        const foldLayer = portrait.querySelector('[data-layer="scarf-folds"]')!;
        const clipId = foldLayer.getAttribute("clip-path")!.slice(5, -1);
        const clip = doc.getElementById(clipId)!.querySelector("path")!;
        expect(clip.getAttribute("clip-rule")).toBe("evenodd");
        // The exact exposed-face contour is subtracted from the fold clip.
        const face = portrait.querySelector(":scope > path")!;
        expect(clip.getAttribute("d")!.endsWith(face.getAttribute("d")!)).toBe(
          true,
        );
        expect(
          portrait.querySelectorAll('[data-layer="hijab-features"] ellipse'),
        ).toHaveLength(2);
        expect(
          portrait.querySelectorAll('[data-layer="hijab-features"] path'),
        ).toHaveLength(2);
        for (const feature of portrait.querySelectorAll(
          '[data-layer="hijab-features"] path',
        ))
          expect(feature.getAttribute("stroke")).toBe("#262323");
        expect(doc.querySelectorAll('[data-layer="crown"]')).toHaveLength(
          preset.traits.accessory === "crown" ? 1 : 0,
        );
        expect(createAvatarDataUri(preset.id, preset.traits)).toBe(
          createAvatarDataUri(preset.id, preset.traits),
        );
      }
    }
    // Scarf and clothing colors remain independently selectable.
    const base = {
      headwear: "hijab",
      scarfColor: "cream",
      clothing: "blue",
      companion: "none",
      accessory: "crown",
    } as const;
    expect(createAvatarSvg("same", base)).not.toBe(
      createAvatarSvg("same", { ...base, scarfColor: "rose" }),
    );
    expect(createAvatarSvg("same", base)).not.toBe(
      createAvatarSvg("same", { ...base, hijabStyle: "draped" }),
    );
    expect(createAvatarSvg("same", { ...base, companion: "duck" })).toContain(
      'data-layer="crown"',
    );
  } finally {
    await window.happyDOM.close();
  }
});

test("crowns exclude other accessories across explicit traits and generated batches", async () => {
  const window = new Window();
  try {
    for (const companion of avatarOptions.companion) {
      for (const glasses of avatarOptions.glasses) {
        for (const headwear of avatarOptions.headwear) {
          const options = {
            accessory: "crown",
            companion,
            glasses,
            headwear,
          } as const;
          const resolved = resolveAvatar("exclusive", options);
          expect(resolved.companion).toBe("none");
          expect(resolved.glasses).toBe("none");
          expect(resolved.headwear).toBe(
            headwear === "hijab" ? "hijab" : "none",
          );
          const doc = new window.DOMParser().parseFromString(
            createAvatarSvg("exclusive", options),
            "image/svg+xml",
          );
          expect(doc.querySelector('[data-layer="crown"]')).not.toBeNull();
          expect(
            doc.querySelector(
              '[data-layer="companion"], [data-layer="glasses"]',
            ),
          ).toBeNull();
        }
      }
    }
    const generated = generateAvatarBatch("exclusive", { count: 200 });
    expect(generated.some((p) => p.traits.accessory === "crown")).toBe(true);
    for (const { traits } of generated) {
      if (traits.accessory === "crown") {
        expect(traits.companion).toBe("none");
        expect(traits.glasses).toBe("none");
        expect(["none", "hijab"]).toContain(traits.headwear);
      }
    }
    for (const seed of Array.from({ length: 100 }, (_, i) => i)) {
      expect(resolveAvatar(seed, { companion: "cat" }).accessory).toBe("none");
      expect(resolveAvatar(seed, { glasses: "round" }).accessory).toBe("none");
      expect(resolveAvatar(seed, { headwear: "beanie" }).accessory).toBe(
        "none",
      );
    }
    const doc = new window.DOMParser().parseFromString(
      createAvatarSvg("simple", { headwear: "none", facialHair: "none" }),
      "image/svg+xml",
    );
    const features = doc.querySelector('[data-layer="face-features"]')!;
    expect(features.querySelectorAll("ellipse")).toHaveLength(2);
    expect(features.querySelectorAll("path")).toHaveLength(3);
    for (const feature of features.querySelectorAll("path"))
      expect(feature.getAttribute("stroke")).toBe("#262323");
  } finally {
    await window.happyDOM.close();
  }
});
