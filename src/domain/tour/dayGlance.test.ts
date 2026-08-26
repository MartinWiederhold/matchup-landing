import { describe, it, expect } from "vitest";
import { acceptedMeetingsForViewer, addIsoDays, buildDayGlance } from "./dayGlance";

describe("acceptedMeetingsForViewer", () => {
  const slot = { id: "s1", user_id: "me", slot_date: "2026-08-26", time_block: "morning", tournament_id: "t1" };

  it("nimmt nur accepted — Eigentümer sieht den Zusager", () => {
    const r = acceptedMeetingsForViewer("me", [slot], [
      { slot_id: "s1", responder_id: "theo", status: "accepted" },
      { slot_id: "s1", responder_id: "x", status: "pending" },
    ]);
    expect(r).toEqual([{ slotId: "s1", date: "2026-08-26", block: "morning", partnerId: "theo", tournamentId: "t1" }]);
  });

  it("Zusager sieht den Slot-Eigentümer", () => {
    const r = acceptedMeetingsForViewer("theo", [{ ...slot, user_id: "me" }], [
      { slot_id: "s1", responder_id: "theo", status: "accepted" },
    ]);
    expect(r[0]?.partnerId).toBe("me");
  });

  it("pending und declined zählen nicht; fremde Slots nicht", () => {
    expect(acceptedMeetingsForViewer("me", [slot], [{ slot_id: "s1", responder_id: "theo", status: "pending" }])).toEqual([]);
    expect(acceptedMeetingsForViewer("me", [slot], [{ slot_id: "s1", responder_id: "theo", status: "declined" }])).toEqual([]);
    expect(acceptedMeetingsForViewer("other", [slot], [{ slot_id: "s1", responder_id: "theo", status: "accepted" }])).toEqual([]);
  });
});

describe("buildDayGlance", () => {
  const today = "2026-08-26";

  it("heute und morgen, Tag danach fällt weg", () => {
    const g = buildDayGlance({
      todayISO: today,
      events: [
        { id: "e1", kind: "physio", title: "Knie", event_date: today, event_time: "09:00:00", opponent: null },
        { id: "e2", kind: "gym", title: "Gym", event_date: "2026-08-28", event_time: "10:00", opponent: null },
      ],
      tournaments: [],
      meetings: [],
    });
    expect(g.map((x) => x.date)).toEqual([today, "2026-08-27"]);
    expect(g[0].rows).toHaveLength(1);
    expect(g[0].rows[0].clock).toBe("09:00");
    expect(g[0].rows[0].eventKind).toBe("physio");
    expect(g[1].rows).toHaveLength(0);
  });

  it("Turnierwoche: Stadt, keine Uhr; Slot bleibt Block ohne Minuten", () => {
    const g = buildDayGlance({
      todayISO: today,
      events: [],
      tournaments: [{ id: "tt", monday: "2026-08-24", city: "Como" }],
      meetings: [{ id: "s1", date: today, block: "morning", partnerName: "Theo", tournamentId: "tt" }],
    });
    const rows = g[0].rows;
    expect(rows[0].source).toBe("tournament");
    expect(rows[0].city).toBe("Como");
    expect(rows[0].clock).toBeNull();
    const slot = rows.find((r) => r.source === "slot");
    expect(slot?.block).toBe("morning");
    expect(slot?.clock).toBeNull();
    expect(slot?.personName).toBe("Theo");
    expect(slot?.eventKind).toBe("training");
  });

  it("Match-Gegner nur bei kind match; Slot ohne Namen bleibt ohne Person", () => {
    const g = buildDayGlance({
      todayISO: today,
      events: [
        { id: "m", kind: "match", title: "R16", event_date: today, event_time: "14:00", opponent: "Ada" },
        { id: "tr", kind: "training", title: "Hit", event_date: today, event_time: "08:00", opponent: "Ignoriert" },
      ],
      tournaments: [],
      meetings: [{ id: "s", date: today, block: "evening", partnerName: "  ", tournamentId: "t" }],
    });
    const match = g[0].rows.find((r) => r.id === "e-m");
    const train = g[0].rows.find((r) => r.id === "e-tr");
    const slot = g[0].rows.find((r) => r.source === "slot");
    expect(match?.personName).toBe("Ada");
    expect(train?.personName).toBeNull();
    expect(slot?.personName).toBeNull();
  });

  it("addIsoDays über Monatsgrenze", () => {
    expect(addIsoDays("2026-08-31", 1)).toBe("2026-09-01");
  });
});
