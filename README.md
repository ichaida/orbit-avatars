# Orbit Avatars

Friendly SVG avatars with a dependency-free TypeScript core, an optional React component and an interactive gallery.

**[Try the gallery](https://orbitavatars.chaida.dev)** · **[MIT license](LICENSE)** · **[Contribute](CONTRIBUTING.md)**

Generate portraits from any string or numeric seed. Customize skin tones, hairstyles, glasses, outfits, hijabs, crowns and small companions. Curated portraits are starting points rather than a fixed catalog limit. All artwork is original, composed from reusable SVG parts, and generated locally without an avatar service.

## Use from GitHub

This project is available from GitHub. It has not been published to npm. Install directly from the public source repository:

```sh
npm install github:ichaida/orbit-avatars
# React component users also need React 18 or newer:
npm install react
```

Git installs run the TypeScript prepare step. For reproducible production installs, pin a reviewed commit SHA or build from a source checkout. To use a local checkout, run `bun install` and `bun run build`, then install its package tarball created with `npm pack`.

```tsx
import { CrewAvatar } from "@ichaida/orbit-avatars/react";

<CrewAvatar
  seed="your-opaque-id"
  size={48}
  options={{ hair: "curls", companion: "cat", outfit: "hoodie" }}
  alt="Your chosen avatar"
/>;
```

Omit `alt` when the image is decorative beside an existing label. Standard image attributes and inline styles are supported. React is an optional peer dependency; the core has no runtime dependencies or DOM access.

```ts
import {
  createAvatarSvg,
  createAvatarDataUri,
  resolveAvatar,
  avatarOptions,
  avatarPresets,
  hijabPresets,
  generateAvatarBatch,
} from "@ichaida/orbit-avatars";

const svg = createAvatarSvg("opaque-id", { companion: "sprout" });
const imageSource = createAvatarDataUri("opaque-id");
const traits = resolveAvatar("opaque-id", { glasses: "round" });
const portrait = avatarPresets[0];
const presetImage = createAvatarDataUri(portrait.id, portrait.traits);

const page = generateAvatarBatch("our-crew", {
  count: 24,
  offset: 1200,
  traits: { headwear: "hijab", accessory: "crown" },
});
```

`generateAvatarBatch` returns frozen ID/name/trait records. Render each with `createAvatarDataUri(record.id, record.traits)`. Use the same seed and constraints with a larger offset for the next page. Up to 200 portraits are generated per call to bound work; there is no fixed catalog-size limit. The artwork parts are finite, so different seeds can look alike and covered traits may be hidden. Persist complete traits for explicitly chosen portraits.

## Customization

All allowed values are available in the readonly `avatarOptions` arrays and the exported `AvatarTraits`/`AvatarOptions` types.

| Option      | Choices                                           |
| ----------- | ------------------------------------------------- |
| Skin        | porcelain, sand, honey, copper, umber, ebony      |
| Hair        | crop, curls, coils, waves, bob, braids, bun, bald |
| Hair color  | ink, chestnut, auburn, gold, silver               |
| Headwear    | none, hijab, turban, beanie                       |
| Glasses     | none, round, square                               |
| Outfit      | crew, hoodie, collar                              |
| Clothing    | iris, teal, blue, marigold, coral, moss           |
| Background  | cream, mint, sky, lilac, rose, peach              |
| Companion   | none, cat, duck, sprout, fox                      |
| Facial hair | none, beard, moustache                            |
| Hijab style | classic, wrapped, draped                          |
| Scarf color | cream, taupe, rose, blue, sage, lilac             |
| Accessory   | none, crown                                       |

Crowns are exclusive: explicitly choosing one clears companions, glasses, beanies and turbans. Hijabs can stay underneath. An explicitly requested other accessory prevents a randomly generated crown from overriding it. The gallery applies the latest accessory selection.

Hijab styles/colors only apply to hijabs. Their hair, ears, neck and facial-hair layers are covered, and fabric folds are clipped outside the exposed face. All faces have dot eyes, a subtle nose and a smile.

Seeds are stable across browsers, SSR and Workers. Non-finite numeric seeds normalize to zero. Invalid runtime trait values fall back to the seeded choice, and SVG titles are XML-escaped. Use opaque IDs; avatars do not infer or depict a real person's identity or demographics. For analytics, scope and rotate identifiers according to your own consent policy.

SVGs use a `120 × 120` viewBox with circular clipping and no filters, external images or fonts. Data URI consumers need `img-src data:` in their CSP. React renders an image data URI, so repeated portraits have isolated SVG IDs and matching SSR/client output.

## Develop

```sh
bun install --frozen-lockfile
bun run check
bun run build
bun run build:site
bun run dev
```

The local gallery is at `http://127.0.0.1:4179`. It supports curated starting points, generated batches, filters, customization, SVG downloads and copying React props. `dist/` contains library JavaScript, declarations and source maps; `site-dist/` contains only the public static gallery. Run `bun run deploy` with authorized Cloudflare access to deploy the configured custom domain.

## License

Copyright © 2026 Ismail Chaida. The code, original vector artwork and generated avatars are available under the [MIT license](LICENSE). Keep its copyright and license notice when redistributing. The gallery's bundled Open Runde fonts remain under the SIL Open Font License; see [third-party notices](THIRD_PARTY_NOTICES.md).
