# Contributing

Bug reports and pull requests are welcome. Include a reproducible seed and trait options when reporting artwork issues; use synthetic IDs rather than personal data.

Use Bun 1.3.5 or newer:

```sh
bun install --frozen-lockfile
bun run check
bun run build
bun run build:site
bun run dev
```

Keep the core dependency free and deterministic across browsers, SSR and Workers. Preserve existing preset IDs and seeded behavior unless documenting an intentional change. Add focused tests for behavior changes. Check artwork at normal app sizes and enlarged, including hijab face openings and exclusive crown behavior.

Create original vector parts; do not submit copied artwork, reference screenshots, credentials or private customer information. By contributing, you agree to license your contributions under this project's MIT license. Font changes must preserve the applicable font license.

The gallery deploys with `bun run deploy` after a maintainer authenticates Wrangler to the correct Cloudflare account. Wrangler owns this site's Worker deployment and custom-domain route. CI validates code and builds the site; it does not store deployment credentials or deploy on pull requests.
