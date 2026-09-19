/**
 * Spiel-Geometrie für das US-Open-Gelände. Kein CAD: Wege, Plätze, Outer Courts
 * und Bäume sind stilisiert nach dem öffentlichen Campus-Schnitt
 * (Stadien nördlich, Practice weiter nördlich, Willets westlich, Park südlich).
 */

import * as THREE from "three";
import type { SiteWorld } from "@/domain/tour/siteWorld";
import { nodeById } from "@/domain/tour/siteWorld";

const GRASS = "#3f6b38";
const GRASS_DARK = "#345a30";
const PARK = "#4a7a42";
const PAVING = "#c9c2b4";
const ROAD = "#5c5a56";
const ROAD_LINE = "#d8d2c4";
const COURT = "#2a4a92";
const COURT_LINE = "#e6d27a";
const PLAZA = "#d7cfc0";
const WATER = "#3d6f86";

function mat(color: string, roughness = 0.85): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

export function disk(r: number, color: string, y = 0.02): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 72), mat(color, 0.92));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.receiveShadow = true;
  return m;
}

/** Wegstück von A nach B (Meter), auf dem Boden. */
export function strip(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  width: number,
  color: string,
  y = 0.08,
): THREE.Mesh {
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.hypot(dx, dz) || 1;
  const m = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, len + 0.4), mat(color, 0.8));
  m.position.set((ax + bx) / 2, y, (az + bz) / 2);
  m.rotation.y = Math.atan2(dx, dz);
  m.receiveShadow = true;
  return m;
}

export function pad(x: number, z: number, w: number, d: number, color: string, y = 0.06): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), mat(color, 0.88));
  m.position.set(x, y, z);
  m.receiveShadow = true;
  return m;
}

function lamp(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 7.2, 6), mat("#3a3a38", 0.5));
  pole.position.y = 3.6;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), new THREE.MeshStandardMaterial({
    color: "#f4e8b8", emissive: "#c9b56a", emissiveIntensity: 0.35, roughness: 0.4,
  }));
  head.position.y = 7.2;
  g.add(pole, head);
  g.position.set(x, 0, z);
  return g;
}

function tree(x: number, z: number, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4 * scale, 0.55 * scale, 4 * scale, 6), mat("#5a3a22", 0.9));
  trunk.position.y = 2 * scale;
  const crown = new THREE.Mesh(new THREE.SphereGeometry(3.1 * scale, 9, 7), mat("#2c5830", 0.92));
  crown.position.y = 5.8 * scale;
  trunk.castShadow = true;
  crown.castShadow = true;
  g.add(trunk, crown);
  g.position.set(x, 0, z);
  return g;
}

function courtTile(x: number, z: number, rot = 0): THREE.Group {
  const g = new THREE.Group();
  const padM = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.22, 23.6), mat(COURT, 0.5));
  padM.position.y = 0.14;
  const ink = mat(COURT_LINE, 0.35);
  const bar = (w: number, d: number, px: number, pz: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.24, d), ink);
    m.position.set(px, 0.16, pz);
    g.add(m);
  };
  bar(0.22, 21.2, 0, 0);
  bar(8.4, 0.22, 0, 0);
  bar(8.4, 0.22, 0, 4.2);
  bar(8.4, 0.22, 0, -4.2);
  bar(0.18, 8.4, 2.6, 0);
  bar(0.18, 8.4, -2.6, 0);
  g.add(padM);
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  g.traverse((c) => { c.receiveShadow = true; });
  return g;
}

function hedge(x: number, z: number, w: number, d: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 1.6, d), mat("#2a4d2c", 0.95));
  m.position.set(x, 0.8, z);
  m.castShadow = true;
  return m;
}

function fence(x: number, z: number, w: number, d: number): THREE.Group {
  const g = new THREE.Group();
  const mesh = mat("#8a9088", 0.45);
  const post = (px: number, pz: number) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.4, 5), mesh);
    p.position.set(px, 1.7, pz);
    g.add(p);
  };
  const rail = (ww: number, dd: number, px: number, pz: number) => {
    const r = new THREE.Mesh(new THREE.BoxGeometry(ww, 0.08, dd), mesh);
    r.position.set(px, 3.2, pz);
    g.add(r);
  };
  post(-w / 2, -d / 2);
  post(w / 2, -d / 2);
  post(-w / 2, d / 2);
  post(w / 2, d / 2);
  rail(w, 0.08, 0, -d / 2);
  rail(w, 0.08, 0, d / 2);
  rail(0.08, d, -w / 2, 0);
  rail(0.08, d, w / 2, 0);
  g.position.set(x, 0, z);
  return g;
}

function flag(x: number, z: number, color: string): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 9, 6), mat("#4a4a46", 0.5));
  pole.position.y = 4.5;
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.5, 0.08), mat(color, 0.55));
  cloth.position.set(1.3, 8.1, 0);
  g.add(pole, cloth);
  g.position.set(x, 0, z);
  return g;
}

function car(x: number, z: number, rot: number, color: string): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 4.4), mat(color, 0.5));
  body.position.y = 0.55;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 2.1), mat("#2a3340", 0.4));
  cabin.position.set(0, 1.15, -0.3);
  g.add(body, cabin);
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  return g;
}

function bleachers(x: number, z: number, rot = 0): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(18, 0.7, 1.8), mat(i % 2 ? "#4a4e56" : "#3a3e44", 0.7));
    step.position.set(0, 0.4 + i * 0.7, i * 1.15);
    step.castShadow = true;
    g.add(step);
  }
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  return g;
}

function scoreboard(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.BoxGeometry(1.2, 8, 1.2), mat("#2c2c2e", 0.5));
  pole.position.y = 4;
  const board = new THREE.Mesh(new THREE.BoxGeometry(14, 5.2, 0.6), mat("#1a1c22", 0.4));
  board.position.set(0, 8.4, 0);
  const face = new THREE.Mesh(
    new THREE.BoxGeometry(12.6, 3.8, 0.2),
    new THREE.MeshStandardMaterial({ color: "#1f3d2a", emissive: "#1a4a28", emissiveIntensity: 0.25 }),
  );
  face.position.set(0, 8.4, 0.35);
  g.add(pole, board, face);
  g.position.set(x, 0, z);
  return g;
}

function stall(x: number, z: number, color: string): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.1, 4.2), mat(color, 0.62));
  body.position.y = 1.55;
  body.castShadow = true;
  const awn = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.25, 4.8), mat("#c43b3b", 0.5));
  awn.position.y = 3.3;
  g.add(body, awn);
  g.position.set(x, 0, z);
  return g;
}

/** Baut das Gelände (nicht pickable). Pick-Gebäude bleiben in SiteWorld. */
export function buildCampus(scene: THREE.Scene, world: SiteWorld): void {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(520, 32, 20),
    new THREE.MeshBasicMaterial({ color: "#9eb6c6", side: THREE.BackSide }),
  );
  scene.add(sky);

  scene.add(disk(300, GRASS_DARK, 0));
  scene.add(disk(240, GRASS, 0.01));
  scene.add(disk(70, PARK, 0.015));
  for (const n of world.nodes) {
    const w = n.kind === "center" ? 86 : n.kind === "court" ? 48 : n.kind === "practice" ? 72 : 32;
    const d = n.kind === "practice" ? 48 : w;
    const color = n.kind === "gate" || n.id === "south-plaza" || n.id === "food-village" ? PLAZA : PAVING;
    scene.add(pad(n.x, n.z, w, d, color, 0.04));
  }
  scene.add(pad(-140, 10, 70, 42, "#6a6862", 0.05));
  const lake = disk(22, WATER, 0.04);
  lake.position.set(42, 0.04, 210);
  scene.add(lake);

  const extraRoads: [number, number, number, number, number][] = [
    [0, 92, 0, 0, 9],
    [0, 0, 18, -95, 8],
    [0, 0, 110, 8, 7],
    [0, 0, -48, -36, 7],
    [-48, -36, -78, -8, 6],
    [18, -95, 8, -188, 8],
    [0, 0, -78, 48, 7],
    [-48, -36, -175, -42, 10],
    [0, 92, 42, 210, 8],
    [-175, -42, -175, 20, 8],
    [-140, 10, -48, -36, 7],
    [110, 8, 148, -10, 6],
    [8, -188, 40, -188, 6],
    [0, 40, 70, 40, 6],
    [-40, 40, 0, 40, 6],
  ];
  for (const [ax, az, bx, bz, w] of extraRoads) {
    scene.add(strip(ax, az, bx, bz, w, ROAD, 0.07));
    scene.add(strip(ax, az, bx, bz, 0.45, ROAD_LINE, 0.13));
  }
  for (const p of world.paths) {
    const a = nodeById(world, p.from);
    const b = nodeById(world, p.to);
    if (!a || !b) continue;
    scene.add(strip(a.x, a.z, b.x, b.z, 6.5, PAVING, 0.09));
  }

  const ring: [number, number][] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ring.push([Math.cos(a) * 38, Math.sin(a) * 38]);
  }
  for (let i = 0; i < ring.length; i++) {
    const [ax, az] = ring[i];
    const [bx, bz] = ring[(i + 1) % ring.length];
    scene.add(strip(ax, az, bx, bz, 7.5, PAVING, 0.08));
  }

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const cx = 148 + col * 14;
      const cz = -10 + row * 28;
      scene.add(courtTile(cx, cz));
      scene.add(fence(cx, cz, 12.4, 25));
    }
  }
  for (let i = 0; i < 6; i++) {
    const cx = -10 + i * 14;
    scene.add(courtTile(cx, -188));
    scene.add(fence(cx, -188, 12.4, 25));
  }
  scene.add(fence(110, 8, 18, 34));
  scene.add(scoreboard(0, 36));
  scene.add(scoreboard(18, -72));
  scene.add(bleachers(110, 28, Math.PI));
  scene.add(bleachers(128, 8, -Math.PI / 2));
  scene.add(flag(-8, 88, "#c43b3b"));
  scene.add(flag(8, 88, "#2a4a92"));
  const carColors = ["#c43b3b", "#2a3340", "#d8d2c4", "#4a6b8a", "#8a8074"];
  for (let i = 0; i < 6; i++) {
    scene.add(car(-158 + (i % 3) * 16, 4 + Math.floor(i / 3) * 14, Math.PI / 2, carColors[i % 5]));
  }

  const kiosk = (x: number, z: number, color: string) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(7, 4.2, 7), mat(color, 0.65));
    m.position.set(x, 2.1, z);
    m.castShadow = true;
    scene.add(m);
  };
  kiosk(32, 48, "#efe6d6");
  kiosk(48, 36, "#e4d3c2");
  kiosk(-28, 48, "#efe6d6");
  kiosk(24, -40, "#d9c8b4");
  kiosk(64, -20, "#efe6d6");
  const stallColors = ["#efe6d6", "#e8d7c4", "#f3eee4", "#dcc9b2", "#efe6d6"];
  for (let i = 0; i < 5; i++) scene.add(stall(38 + i * 7, 58, stallColors[i]));
  for (let i = 0; i < 4; i++) scene.add(stall(-36 - i * 7, 52, stallColors[i]));

  for (let i = 0; i < 6; i++) {
    scene.add(pad(-158 + (i % 3) * 16, 4 + Math.floor(i / 3) * 14, 12, 5.5, "#5a5854", 0.08));
  }
  scene.add(hedge(-40, 18, 18, 1.2));
  scene.add(hedge(40, 18, 18, 1.2));
  scene.add(hedge(-95, -8, 1.2, 36));
  scene.add(hedge(70, -40, 1.2, 28));
  scene.add(hedge(20, 105, 22, 1.2));

  const trees: [number, number, number?][] = [
    [-40, 40], [36, 46], [70, -20], [-90, -70], [50, -140], [-30, -150],
    [140, -40], [-120, 20], [20, 140], [-55, 70], [55, 70], [90, 20],
    [-20, -60], [40, -50], [70, -110], [-70, -110], [20, -220], [-20, -220],
    [60, 180], [20, 190], [70, 220], [-10, 160], [-160, -10], [-160, -70],
    [160, 20], [170, -60], [100, -160], [-50, -200], [130, -120],
  ];
  for (const [x, z, s] of trees) scene.add(tree(x, z, s ?? 1));
  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue;
    scene.add(tree(-12, i * 18, 0.85));
    scene.add(tree(12, i * 18, 0.85));
  }
  for (let i = 0; i < 8; i++) {
    scene.add(tree(-155 + i * 12, 28, 0.75));
    scene.add(tree(-90 + i * 14, -55, 0.8));
  }

  const lamps: [number, number][] = [
    [8, 70], [-8, 70], [8, 40], [-8, 40], [8, 12], [-8, 12],
    [10, -40], [28, -70], [50, -80], [70, -60], [90, -20],
    [-30, -20], [-70, -30], [-110, -38], [-150, -40],
    [0, -130], [20, -160], [40, 120], [30, 170],
  ];
  for (const [x, z] of lamps) scene.add(lamp(x, z));
}

export function highlightPath(ids: string[], world: SiteWorld): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < ids.length - 1; i++) {
    const a = nodeById(world, ids[i]);
    const b = nodeById(world, ids[i + 1]);
    if (!a || !b) continue;
    g.add(strip(a.x, a.z, b.x, b.z, 3.2, "#f4f0e4", 0.22));
  }
  return g;
}
