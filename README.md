# Greene County Tenant Case Tracker

A small [Next.js](https://nextjs.org) app that fetches the public Greene County, MO
court docket feed and displays just the tenant / associate-circuit cases (case
numbers starting with `2631-AC03` or `2631-AC04`) in a table, with a one-click CSV
export.

## How it works

- **`src/app/api/cases/route.ts`** — a Route Handler that fetches the XML docket
  feed, parses it with [`fast-xml-parser`](https://github.com/NaturalIntelligence/fast-xml-parser),
  filters to the two case-number prefixes, and returns clean JSON (`{ cases: [...] }`).
  It runs with `dynamic = "force-dynamic"` and `fetch(..., { cache: "no-store" })`
  so the docket is always live.
- **`src/app/page.tsx`** — a client page that calls `/api/cases` on load, renders a
  table (Case Name, Case Number, Courtroom, Floor, Hearing Time, Judge) with
  loading / error / empty states, a Refresh button, and an Export-to-CSV button.

Data source: `https://infax.com/docket/MO-Greene/data/newdata.xml`

Hearing times arrive as timezone-less ISO strings (e.g. `2026-07-07T14:00:00`) and
are formatted as local wall-clock time (e.g. `2:00 PM`).

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The raw JSON is available at
[http://localhost:3000/api/cases](http://localhost:3000/api/cases).

## Deployment

Deploys to [Vercel](https://vercel.com) with zero configuration — import the repo
and deploy. No environment variables are required (the data source is public).
