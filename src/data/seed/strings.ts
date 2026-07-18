/**
 * Demo-Seed für den Saiten-Finder (Beratungsplattform, Phase 6 — MVP).
 * Material/Charakter = allgemein bekannte Einordnung; `ratings` redaktionelle
 * Einschätzung (kein Labor) → confidence "medium", isDemoData: true.
 * Spannungsangaben immer als Bereich (Doc-Prinzip).
 */
import { assertString, type StringProduct } from "@/domain/equipment/string";

const SEED: StringProduct[] = [
  {
    id: "alu-power", slug: "luxilon-alu-power", brand: "Luxilon", name: "ALU Power", material: "polyester",
    ratings: { power: 52, control: 84, spin: 74, comfort: 38, durability: 74, tensionMaintenance: 58, feel: 70 },
    baseTensionKg: { min: 23, max: 25 },
    editorial: { summary: { de: "Der Kontroll-Standard vieler Profis — präzise und spinstark, aber eher hart.", en: "The control standard for many pros — precise and spin-friendly, but on the firm side." } },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Charakter allgemein bekannt; Ratings redaktionell (Demo)." },
  },
  {
    id: "rpm-blast", slug: "babolat-rpm-blast", brand: "Babolat", name: "RPM Blast", material: "polyester",
    ratings: { power: 50, control: 80, spin: 86, comfort: 40, durability: 72, tensionMaintenance: 56, feel: 64 },
    baseTensionKg: { min: 23, max: 25 },
    editorial: { summary: { de: "Kantige Polyestersaite mit sehr viel Spin — für aggressive Grundlinienspieler.", en: "Shaped poly with lots of spin — for aggressive baseliners." } },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Charakter allgemein bekannt; Ratings redaktionell (Demo)." },
  },
  {
    id: "tour-bite", slug: "solinco-tour-bite", brand: "Solinco", name: "Tour Bite", material: "polyester",
    ratings: { power: 46, control: 82, spin: 88, comfort: 34, durability: 76, tensionMaintenance: 54, feel: 58 },
    baseTensionKg: { min: 22, max: 24 },
    editorial: { summary: { de: "Sehr spinorientierte, harte Saite — maximaler Grip am Ball, wenig Komfort.", en: "Very spin-focused, firm string — maximum bite, low comfort." } },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Charakter allgemein bekannt; Ratings redaktionell (Demo)." },
  },
  {
    id: "poly-tour-pro", slug: "yonex-poly-tour-pro", brand: "Yonex", name: "Poly Tour Pro", material: "polyester",
    ratings: { power: 56, control: 74, spin: 66, comfort: 58, durability: 70, tensionMaintenance: 60, feel: 68 },
    baseTensionKg: { min: 22, max: 24 },
    editorial: { summary: { de: "Weichere Polyestersaite — Kontrolle mit spürbar mehr Komfort als klassische Polys.", en: "A softer poly — control with noticeably more comfort than classic polys." } },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Charakter allgemein bekannt; Ratings redaktionell (Demo)." },
  },
  {
    id: "nxt", slug: "wilson-nxt", brand: "Wilson", name: "NXT", material: "multifilament",
    ratings: { power: 74, control: 56, spin: 50, comfort: 84, durability: 48, tensionMaintenance: 66, feel: 78 },
    baseTensionKg: { min: 24, max: 26 },
    editorial: { summary: { de: "Komfortable Multifilamentsaite mit viel Power — freundlich zum Arm.", en: "A comfortable multifilament with lots of power — friendly to the arm." } },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Charakter allgemein bekannt; Ratings redaktionell (Demo)." },
  },
  {
    id: "x-one-biphase", slug: "tecnifibre-x-one-biphase", brand: "Tecnifibre", name: "X-One Biphase", material: "multifilament",
    ratings: { power: 78, control: 58, spin: 52, comfort: 88, durability: 46, tensionMaintenance: 64, feel: 84 },
    baseTensionKg: { min: 24, max: 26 },
    editorial: { summary: { de: "Sehr weiche, gefühlvolle Multifilamentsaite — Top-Komfort und Power.", en: "A very soft, feel-rich multifilament — top comfort and power." } },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Charakter allgemein bekannt; Ratings redaktionell (Demo)." },
  },
  {
    id: "velocity-mlt", slug: "head-velocity-mlt", brand: "Head", name: "Velocity MLT", material: "multifilament",
    ratings: { power: 70, control: 58, spin: 50, comfort: 82, durability: 52, tensionMaintenance: 62, feel: 74 },
    baseTensionKg: { min: 24, max: 26 },
    editorial: { summary: { de: "Ausgewogene Multifilamentsaite — armschonend und alltagstauglich.", en: "A balanced multifilament — arm-friendly and versatile for everyday play." } },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Charakter allgemein bekannt; Ratings redaktionell (Demo)." },
  },
  {
    id: "vs-touch", slug: "babolat-vs-touch", brand: "Babolat", name: "VS Touch (Naturdarm)", material: "natural-gut",
    ratings: { power: 82, control: 62, spin: 54, comfort: 92, durability: 44, tensionMaintenance: 88, feel: 92 },
    baseTensionKg: { min: 24, max: 26 },
    editorial: { summary: { de: "Naturdarm — höchster Komfort, bestes Gefühl und Spannungshaltung, dafür teuer.", en: "Natural gut — top comfort, feel and tension maintenance, but pricey." } },
    provenance: { confidence: "medium", isDemoData: true, sourceNote: "Charakter allgemein bekannt; Ratings redaktionell (Demo)." },
  },
];

let cache: StringProduct[] | null = null;
export function getStrings(): StringProduct[] {
  if (!cache) cache = SEED.map(assertString);
  return cache;
}
