import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

/**
 * Score-Card als teilbares Bild (1080×1350, vertikal — ideal für WhatsApp,
 * Stories & Feed). Rein per Query-Parameter, damit die Card auch ohne DB
 * sofort funktioniert. Später kann eine /score/[id]-Seite dieselben Werte aus
 * einem echten Ergebnis füllen.
 *
 * Params:
 *  a     Team A (z. B. "Martin" oder "Martin & Lea")
 *  b     Team B
 *  s     Score, Sätze durch Leerzeichen getrennt (z. B. "6:3 6:4")
 *  w     Gewinner: "a" | "b"
 *  sport "tennis" | "padel" | "pickleball"
 *  date  bereits formatiertes Datum (z. B. "12. Juli 2026")
 *  loc   Ort
 *  delta optionale Rating-Veränderung (z. B. "+12")
 *  lang  "de" | "en"
 */

const ACCENT = "#4b3bf3";
const ACCENT_SOFT = "#8b7bff";

const SPORT_LABEL: Record<string, string> = {
  tennis: "Tennis",
  padel: "Padel",
  pickleball: "Pickleball",
};

const T = {
  de: { eyebrow: "ENDSTAND", winner: "GEWINNER", tagline: "Finde deinen Spielpartner" },
  en: { eyebrow: "FINAL SCORE", winner: "WINNER", tagline: "Find your playing partner" },
};

function initials(name: string) {
  return name
    .split(/[\s&/]+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const lang = q.get("lang") === "en" ? "en" : "de";
  const tr = T[lang];
  const teamA = q.get("a") || "Team A";
  const teamB = q.get("b") || "Team B";
  const score = (q.get("s") || "").trim();
  const sets = score ? score.split(/\s+/).slice(0, 5) : [];
  const winner = q.get("w") === "b" ? "b" : "a";
  const sport = SPORT_LABEL[q.get("sport") || ""] || "Match";
  const date = q.get("date") || "";
  const loc = q.get("loc") || "";
  const delta = q.get("delta") || "";

  const metaParts = [sport, date, loc].filter(Boolean).join("  ·  ");

  const Side = ({ name, isWinner }: { name: string; isWinner: boolean }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        width: "100%",
        opacity: isWinner ? 1 : 0.72,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 92,
          height: 92,
          borderRadius: 100,
          background: isWinner ? ACCENT : "#1c1c22",
          color: "#fff",
          fontSize: 38,
          fontWeight: 700,
          border: isWinner ? "none" : "1px solid #2c2c34",
        }}
      >
        {initials(name)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", fontSize: 52, fontWeight: 700, color: "#fff" }}>
          {name}
        </div>
        {isWinner && (
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: ACCENT,
              color: "#fff",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2,
              padding: "6px 16px",
              borderRadius: 100,
            }}
          >
            {tr.winner}
          </div>
        )}
      </div>
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08080a",
          padding: 72,
          fontFamily: "sans-serif",
          color: "#fff",
          position: "relative",
        }}
      >
        {/* Akzent-Schein oben */}
        <div
          style={{
            position: "absolute",
            top: -260,
            right: -180,
            width: 520,
            height: 520,
            borderRadius: 520,
            background: ACCENT,
            opacity: 0.22,
          }}
        />

        {/* Kopf */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: 8 }}>
            MATCHUP
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 3,
              color: ACCENT_SOFT,
              border: `1px solid ${ACCENT}`,
              padding: "10px 22px",
              borderRadius: 100,
            }}
          >
            {sport.toUpperCase()}
          </div>
        </div>

        {/* Mitte */}
        <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 6,
              color: "#8b8b96",
            }}
          >
            {tr.eyebrow}
          </div>

          <Side name={teamA} isWinner={winner === "a"} />

          {/* Score */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, paddingLeft: 116 }}>
            {sets.length > 0 ? (
              sets.map((set, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 118,
                    height: 118,
                    borderRadius: 24,
                    background: "#111117",
                    border: "1px solid #26262e",
                    fontSize: 62,
                    fontWeight: 800,
                    padding: "0 20px",
                  }}
                >
                  {set}
                </div>
              ))
            ) : (
              <div style={{ display: "flex", fontSize: 40, color: "#6b6b76" }}>
                {lang === "de" ? "Gespielt" : "Played"}
              </div>
            )}
            {delta && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginLeft: 8,
                  fontSize: 40,
                  fontWeight: 800,
                  color: ACCENT_SOFT,
                }}
              >
                {delta}
              </div>
            )}
          </div>

          <Side name={teamB} isWinner={winner === "b"} />
        </div>

        {/* Fuss */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", height: 1, width: "100%", background: "#22222a" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 26, color: "#8b8b96" }}>{metaParts}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: "#fff" }}>
              matchup-app.com
            </div>
            <div style={{ display: "flex", fontSize: 26, color: "#8b8b96" }}>{tr.tagline}</div>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 },
  );
}
