import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

export const dynamic = "force-dynamic";

const DATA_URL = "https://infax.com/docket/MO-Greene/data/newdata.xml";
const CASENET_URL_PREFIX = "https://www.courts.mo.gov/casenet/cases"
const CASE_PREFIXES = ["2631-AC03", "2631-AC04"] as const;

export interface Case {
  caseName: string;
  caseNumber: string;
  floorID: string; // Floor
  roomID: string; // Courtroom
  timeStart: string; // raw ISO string, formatted in the UI
  judgeName: string;
  dateFiled: string;
  caseType: string;
  disposition: string;
  plaintiff: string;
  defendant: string;
  attorneyForPlaintiff: string;
  attorneyForDefendant: string;
}

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
    const raw = parsed?.Data?.["Docket..docketData"];
    const dockets: RawDocket[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const cases: Case[] = dockets.map((d) => ({
      caseName: toStr(d.caseName),
      caseNumber: toStr(d.caseNumber),
      roomID: toStr(d.roomID),
      floorID: toStr(d.floorID),
      timeStart: toStr(d.timeStart),
      judgeName: toStr(d.judgeName),
      dateFiled: '',
      caseType: '',
      disposition: '',
      plaintiff: '',
      defendant: '',
      attorneyForPlaintiff: '',
      attorneyForDefendant: ''
    })).filter((c) => CASE_PREFIXES.some((p) => {
      return c.caseNumber.startsWith(p)
    }));

    return NextResponse.json({ cases });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to parse docket data: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
