import { describe, it, expect } from "vitest";
import { needsDocument, docCoversDestination, bestDocumentFor } from "./travelDocMatch";

describe("needsDocument", () => {
  it("verlangt ein Dokument bei eta/evisa/visa_on_arrival/visa_required", () => {
    for (const rc of ["eta", "evisa", "visa_on_arrival", "visa_required"] as const) expect(needsDocument(rc)).toBe(true);
  });
  it("verlangt keins bei visa_free und admission_refused", () => {
    expect(needsDocument("visa_free")).toBe(false);
    expect(needsDocument("admission_refused")).toBe(false);
  });
});

describe("docCoversDestination", () => {
  it("deckt das Zielland über den ISO2-Bereich direkt", () => {
    expect(docCoversDestination("US", "US", false)).toBe(true);
    expect(docCoversDestination("US", "us", false)).toBe(true); // Zielland case-insensitiv
  });
  it("SCHENGEN deckt ein Schengen-Zielland, aber kein Nicht-Schengen-Land", () => {
    expect(docCoversDestination("SCHENGEN", "GR", true)).toBe(true);
    expect(docCoversDestination("SCHENGEN", "US", false)).toBe(false);
  });
  it("deckt nicht bei falschem Land oder fehlendem Bereich", () => {
    expect(docCoversDestination("TR", "US", false)).toBe(false);
    expect(docCoversDestination(null, "US", false)).toBe(false);
  });
});

describe("bestDocumentFor", () => {
  const D = (scope: string | null, status: "have" | "applied" | "none", valid_until: string | null, tag: string) =>
    ({ scope, status, valid_until, tag });

  it("liefert null, wenn kein Dokument das Zielland deckt", () => {
    expect(bestDocumentFor([D("TR", "have", "2027-01-01", "tr")], "US", false)).toBeNull();
  });

  it("bevorzugt 'have' vor 'applied'", () => {
    const docs = [D("US", "applied", null, "a"), D("US", "have", "2027-03-12", "h")];
    expect(bestDocumentFor(docs, "US", false)?.tag).toBe("h");
  });

  it("bei gleichem Status gewinnt das spaetere Ablaufdatum", () => {
    const docs = [D("US", "have", "2026-05-01", "früh"), D("US", "have", "2028-05-01", "spät")];
    expect(bestDocumentFor(docs, "US", false)?.tag).toBe("spät");
  });

  it("ein Schengen-Visum matcht ein Schengen-Zielland", () => {
    const docs = [D("SCHENGEN", "have", "2027-06-30", "schengen"), D("TR", "have", "2027-01-01", "tr")];
    expect(bestDocumentFor(docs, "FR", true)?.tag).toBe("schengen");
  });
});
