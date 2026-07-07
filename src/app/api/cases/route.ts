import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

// Always fetch the live docket on each request; never cache at build time.
export const dynamic = "force-dynamic";

const DATA_URL = "https://infax.com/docket/MO-Greene/data/newdata.xml";

// Only tenant / associate-circuit cases with these case-number prefixes.
const CASE_PREFIXES = ["2631-AC03", "2631-AC04"] as const;

export interface Case {
  caseName: string;
  caseNumber: string;
  roomID: string; // Courtroom
  floorID: string; // Floor
  timeStart: string; // raw ISO string, formatted in the UI
  judgeName: string;
}

// Raw shape of each <Docket..docketData> element after XML parsing. Every field
// is a simple text node, but values can be missing or numeric, so treat loosely.
type RawDocket = Record<string, unknown>;

function toStr(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export async function GET() {
  let xml: string;
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status} ${res.statusText}` },
        { status: 502 },
      );
    }
    xml = await res.text();
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch docket data: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  try {
    const parser = new XMLParser();
    const parsed = parser.parse(xml);

    // Root is <Data>, each case is a <Docket..docketData> element.
    const raw = parsed?.Data?.["Docket..docketData"];
    const dockets: RawDocket[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

    const cases: Case[] = dockets
      .map((d) => ({
        caseName: toStr(d.caseName),
        caseNumber: toStr(d.caseNumber),
        roomID: toStr(d.roomID),
        floorID: toStr(d.floorID),
        timeStart: toStr(d.timeStart),
        judgeName: toStr(d.judgeName),
      }))
      .filter((c) => CASE_PREFIXES.some((p) => c.caseNumber.startsWith(p)));

    return NextResponse.json({ cases });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to parse docket data: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
