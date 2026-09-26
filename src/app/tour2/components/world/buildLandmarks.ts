/**
 * Bauten nach der US-Open-Grounds-Map, mit mehr Tiefe als die offizielle 2.5D-Karte:
 * massives weißes Ashe-Dach, volle weiße Tribünenblöcke, nummerierte Outer Courts.
 * Spiel-Geometrie — kein CAD, keine erfundenen Innenräume oder Standnamen.
 */

import * as THREE from "three";

const COURT = "#1568e6";
const LINE = "#ffffff";
const SEAT = "#f4f2eb";
const SEAT_ALT = "#e8e4da";
const WALL = "#c4a07a";
const ROOF = "#f8f6f1";
const WHITE = "#f5f3ee";
const BANK = "#f3f1ea";

function mat(color: string, extra: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.72, ...extra });
}

/** Tennisplatz mit Doppel-/Einzel-Linien, Netz, optional Nummer. */
export function tennisCourt(w: number, d: number, badge?: string): THREE.Group {
  const g = new THREE.Group();
  const blue = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, d), mat(COURT, { roughness: 0.38 }));
  blue.position.y = 0.1;
  blue.receiveShadow = true;
  g.add(blue);
  const ink = mat(LINE, { roughness: 0.24 });
  const bar = (ww: number, dd: number, x: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(ww, 0.05, dd), ink);
    m.position.set(x, 0.2, z);
    g.add(m);
  };
  const doublesW = w * 0.92;
  const singlesW = w * 0.69;
  const playD = d * 0.92;
  bar(doublesW, 0.12, 0, playD / 2);
  bar(doublesW, 0.12, 0, -playD / 2);
  bar(0.12, playD, doublesW / 2, 0);
  bar(0.12, playD, -doublesW / 2, 0);
  bar(0.1, playD, singlesW / 2, 0);
  bar(0.1, playD, -singlesW / 2, 0);
  const svc = playD * 0.27;
  bar(singlesW, 0.1, 0, svc);
  bar(singlesW, 0.1, 0, -svc);
  bar(0.1, svc * 2, 0, 0);
  bar(singlesW * 0.12, 0.1, 0, playD / 2);
  bar(singlesW * 0.12, 0.1, 0, -playD / 2);
  const net = new THREE.Mesh(new THREE.BoxGeometry(doublesW + 0.8, 0.92, 0.07), mat("#d5d9de", { roughness: 0.32 }));
  net.position.y = 0.56;
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.08, 6), mat("#7a8078"));
  postL.position.set(-doublesW / 2 - 0.3, 0.56, 0);
  const postR = postL.clone();
  postR.position.x = doublesW / 2 + 0.3;
  g.add(net, postL, postR);
  if (badge) {
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(2.85, 32),
      new THREE.MeshBasicMaterial({ map: numberTex(badge) }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.24;
    g.add(disc);
  }
  return g;
}

const texCache = new Map<string, THREE.CanvasTexture>();

function numberTex(n: string): THREE.CanvasTexture {
  const hit = texCache.get(n);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 160;
  c.height = 160;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 160, 160);
    ctx.beginPath();
    ctx.arc(80, 80, 68, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.fillStyle = "#1a46b0";
    ctx.font = "800 86px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(n, 80, 86);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  texCache.set(n, tex);
  return tex;
}

function labelPlate(text: string, w = 2.4, h = 1.05): THREE.Mesh {
  const key = `p:${text}:${w}`;
  let tex = texCache.get(key);
  if (!tex) {
    const c = document.createElement("canvas");
    c.width = text.length > 10 ? 512 : 256;
    c.height = 96;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#1a46b0";
      ctx.fillRect(0, 0, c.width, 96);
      ctx.fillStyle = "#ffffff";
      ctx.font = text.length > 10 ? "700 34px system-ui, sans-serif" : "700 42px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, c.width / 2, 52);
    }
    tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    texCache.set(key, tex);
  }
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }),
  );
  return m;
}

/** Abschnitte laut offiziellem Sitzplan — nur Zahlen von der Chart, keine erfundenen. */
function addSectionLabels(bowl: THREE.Group, radius: number, y: number, nums: string[]): void {
  nums.forEach((n, i) => {
    const a = (i / nums.length) * Math.PI * 2 - Math.PI / 2;
    const m = labelPlate(n, 2.1, 0.95);
    m.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
    m.lookAt(0, y, 0);
    bowl.add(m);
  });
}

/** Außenfassade — lesbar ohne unter das Dach zu fliegen. */
function addOuterLabels(host: THREE.Group, radius: number, y: number, nums: string[]): void {
  nums.forEach((n, i) => {
    const a = (i / nums.length) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    const m = labelPlate(n, 3.4, 1.5);
    m.position.set(x, y, z);
    m.lookAt(x * 2, y, z * 2);
    host.add(m);
  });
}

function hexShape(r: number): THREE.Shape {
  const s = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

function roofPanelTex(): THREE.CanvasTexture {
  const key = "roof-panel";
  const hit = texCache.get(key);
  if (hit) return hit;
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ece8df";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "#8a8478";
    ctx.lineWidth = 5;
    const cx = size / 2;
    const cy = size / 2;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 280, cy + Math.sin(a) * 280);
      ctx.stroke();
    }
    ctx.strokeStyle = "#b0aaa0";
    ctx.lineWidth = 3;
    for (const rad of [70, 130, 190, 250]) {
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 2;
        const x = cx + Math.cos(a) * rad;
        const y = cy + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, tex);
  return tex;
}

function roofWithHole(r: number, holeW: number, holeD: number, y: number, thick = 2.35, mapped = false): THREE.Mesh {
  const shape = hexShape(r);
  const hole = new THREE.Path();
  hole.moveTo(-holeW / 2, -holeD / 2);
  hole.lineTo(holeW / 2, -holeD / 2);
  hole.lineTo(holeW / 2, holeD / 2);
  hole.lineTo(-holeW / 2, holeD / 2);
  hole.closePath();
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false });
  const m = new THREE.Mesh(
    geo,
    mat(ROOF, mapped ? { roughness: 0.32, metalness: 0.08, map: roofPanelTex() } : { roughness: 0.28, metalness: 0.1 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Volle weiße Tribüne wie auf der Grounds Map — Block, keine dünnen Stufen. */
export function whiteBank(w: number, d: number, h: number, x: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(BANK, { roughness: 0.46 }));
  m.position.set(x, h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function seatDecks(
  bowl: THREE.Group,
  r: number,
  tiers: number,
  bowlH: number,
  segs = 56,
  ink = SEAT,
  inkAlt = SEAT_ALT,
): void {
  const seatGeo = new THREE.BoxGeometry(0.72, 0.52, 0.58);
  const seatMats = [
    mat(ink, { roughness: 0.48 }),
    mat(inkAlt, { roughness: 0.48 }),
  ];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < tiers; i++) {
    const inner = r * (0.5 + i * 0.15);
    const outer = inner + r * 0.148;
    const y = 0.95 + i * (bowlH / (tiers + 0.2));
    const deck = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, segs),
      mat(i % 2 ? inkAlt : ink, { roughness: 0.48, side: THREE.DoubleSide }),
    );
    deck.rotation.x = -Math.PI / 2;
    deck.position.y = y - 0.22;
    deck.receiveShadow = true;
    bowl.add(deck);
    const radius = (inner + outer) / 2;
    const slots = Math.max(20, Math.round(radius * 3.8));
    const placed: number[] = [];
    for (let k = 0; k < slots; k++) {
      if (k % 9 === 0) continue;
      placed.push(k);
    }
    const seats = new THREE.InstancedMesh(seatGeo, seatMats[i % 2], placed.length);
    seats.castShadow = true;
    placed.forEach((k, idx) => {
      const a = (k / slots) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
      dummy.lookAt(0, y, 0);
      dummy.rotateY(Math.PI);
      dummy.updateMatrix();
      seats.setMatrixAt(idx, dummy.matrix);
    });
    bowl.add(seats);
  }
}

/** Rampe — stilisiert, kein CAD. */
export function accessRamp(len: number, w: number, rise: number): THREE.Group {
  const g = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.28, len), mat("#e8e4dc", { roughness: 0.55 }));
  slab.rotation.x = -Math.atan2(rise, len);
  slab.position.set(0, rise / 2, 0);
  slab.castShadow = true;
  const railL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, len), mat("#c8c4ba"));
  railL.position.set(-w / 2 + 0.1, rise / 2 + 0.4, 0);
  railL.rotation.x = -Math.atan2(rise, len);
  const railR = railL.clone();
  railR.position.x = w / 2 - 0.1;
  g.add(slab, railL, railR);
  return g;
}

/** Offenes Oval: Court + weiße Sitzringe, von oben wie die Grounds Map. */
export function openBowl(id: string, r: number, tiers: number, ovalX = 1.28, badge?: string): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = id;
  const court = tennisCourt(Math.min(r * 0.5, 14.5), Math.min(r * 0.9, 29), badge);
  court.position.y = 0.02;
  g.add(court);
  const bowl = new THREE.Group();
  const bowlH = Math.max(8.2, r * 0.36);
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 1.16, r * 1.24, bowlH, 56, 1, true),
    mat(WHITE, { side: THREE.DoubleSide, roughness: 0.5 }),
  );
  shell.position.y = bowlH / 2;
  shell.castShadow = true;
  bowl.add(shell);
  seatDecks(bowl, r, tiers, bowlH, 56, "#efe6d4", "#d4cbb8");
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(r * 1.18, 0.95, 8, 56),
    mat("#1a46b0", { roughness: 0.34 }),
  );
  lip.rotation.x = Math.PI / 2;
  lip.position.y = bowlH;
  bowl.add(lip);
  bowl.scale.set(ovalX, 1, 1);
  g.add(bowl);
  g.add(facadeColumns(r * 1.22, bowlH, 12));
  g.add(ledRibbon(r * 1.16, bowlH * 0.58));
  const ramp = accessRamp(14, 3.4, 2.2);
  ramp.position.set(0, 0, r * 1.28);
  g.add(ramp);
  return g;
}

function hexRim(r: number, y: number): THREE.Line {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r, y, -Math.sin(a) * r));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: "#d4cfc4" }),
  );
}

/** Hex-Kante als Balken — sonst liest sich das Dach von oben als Papierfläche. */
function hexFrame(r: number, y: number, thick: number, h: number, color: string): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2 + Math.PI / 2;
    const a1 = ((i + 1) / 6) * Math.PI * 2 + Math.PI / 2;
    const x0 = Math.cos(a0) * r;
    const z0 = -Math.sin(a0) * r;
    const x1 = Math.cos(a1) * r;
    const z1 = -Math.sin(a1) * r;
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(thick, h, len + thick * 0.35),
      mat(color, { roughness: 0.32, metalness: 0.08 }),
    );
    beam.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    beam.rotation.y = Math.atan2(dx, dz);
    beam.castShadow = true;
    g.add(beam);
  }
  return g;
}

/** Sechs Dachrippen vom Court-Loch zu den Hex-Ecken. */
function roofRibs(outer: number, inner: number, y: number): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 2;
    const x0 = Math.cos(a) * inner;
    const z0 = -Math.sin(a) * inner;
    const x1 = Math.cos(a) * outer;
    const z1 = -Math.sin(a) * outer;
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 2.4, len),
      mat("#3e3a34", { roughness: 0.4 }),
    );
    rib.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    rib.rotation.y = Math.atan2(dx, dz);
    rib.castShadow = true;
    g.add(rib);
  }
  return g;
}

function ledRibbon(r: number, y: number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(r, 0.38, 6, 64),
    new THREE.MeshStandardMaterial({
      color: "#1a46b0",
      roughness: 0.32,
      emissive: "#1a46b0",
      emissiveIntensity: 0.42,
    }),
  );
  m.rotation.x = Math.PI / 2;
  m.position.y = y;
  return m;
}

function facadeColumns(r: number, h: number, count: number): THREE.Group {
  const g = new THREE.Group();
  const col = mat(WHITE, { roughness: 0.42 });
  const glass = mat("#6a7a88", { roughness: 0.18, metalness: 0.32, transparent: true, opacity: 0.62 });
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 1.01, r * 1.01, h * 0.42, 48, 1, true),
    glass,
  );
  band.position.y = h * 0.62;
  g.add(band);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const post = new THREE.Mesh(new THREE.BoxGeometry(1.15, h, 1.15), col);
    post.position.set(x, h / 2, z);
    post.castShadow = true;
    g.add(post);
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.16, h * 0.4, 0.16), mat("#3a4248", { roughness: 0.35 }));
    mullion.position.set(x * 1.015, h * 0.62, z * 1.015);
    g.add(mullion);
  }
  return g;
}

/** Südportal — stilisiert, kein CAD, Lage Richtung Champion's Entry. */
function entryPortal(x: number, z: number, rotY: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  const ink = mat("#1c1c1e", { roughness: 0.45 });
  const white = mat(WHITE, { roughness: 0.42 });
  const voidPlane = new THREE.Mesh(new THREE.BoxGeometry(7.2, 4.6, 0.2), ink);
  voidPlane.position.set(0, 2.4, 0.2);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.55, 1.6), white);
  lintel.position.set(0, 4.85, 0);
  lintel.castShadow = true;
  const jambL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.8, 1.4), white);
  jambL.position.set(-3.9, 2.4, 0);
  const jambR = jambL.clone();
  jambR.position.x = 3.9;
  g.add(voidPlane, lintel, jambL, jambR);
  return g;
}

/** Ashe: sandfarbene Schale, dickes weißes Hex-Dach mit Court-Öffnung. */
export function asheStadium(): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = "ashe";
  const court = tennisCourt(16.4, 33.2);
  court.position.y = 0.04;
  g.add(court);
  const bowl = new THREE.Group();
  const r = 28;
  const bowlH = 12.4;
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 1.08, r * 1.16, bowlH, 64, 1, true),
    mat(WHITE, { side: THREE.DoubleSide, roughness: 0.5 }),
  );
  shell.position.y = bowlH / 2;
  shell.castShadow = true;
  bowl.add(shell);
  seatDecks(bowl, r, 5, bowlH, 64, "#2f5cb8", "#244a96");
  addSectionLabels(bowl, r * 0.74, 4.4, ["10", "18", "26", "34", "42", "50", "58", "2"]);
  const courtside = labelPlate("Courtside", 4.6, 1.05);
  courtside.position.set(0, 2.1, r * 0.56);
  courtside.lookAt(0, 2.1, 0);
  const loge = labelPlate("Loge", 3.4, 1.05);
  loge.position.set(0, 6.1, r * 0.82);
  loge.lookAt(0, 6.1, 0);
  const promenade = labelPlate("Promenade", 5.2, 1.05);
  promenade.position.set(0, 10.2, r * 1.05);
  promenade.lookAt(0, 10.2, 0);
  bowl.add(courtside, loge, promenade);
  bowl.scale.set(1.18, 1, 1);
  g.add(bowl);
  addOuterLabels(g, 46, 7.4, ["10", "18", "26", "34", "42", "50", "58", "2"]);
  const bandCs = labelPlate("Courtside", 8.4, 1.7);
  bandCs.position.set(0, 3.6, 46);
  bandCs.lookAt(0, 3.6, 80);
  const bandLg = labelPlate("Loge", 6.2, 1.7);
  bandLg.position.set(46, 7.2, 0);
  bandLg.lookAt(80, 7.2, 0);
  const bandPr = labelPlate("Promenade", 9.2, 1.7);
  bandPr.position.set(0, 10.8, -46);
  bandPr.lookAt(0, 10.8, -80);
  g.add(bandCs, bandLg, bandPr);
  const fascia = roofWithHole(44.5, 34, 46, 12.15, 1.2);
  fascia.material = mat("#e6e2d8", { roughness: 0.4 });
  g.add(fascia);
  g.add(roofWithHole(44.2, 32, 44, 13.2, 2.6, true));
  g.add(hexRim(44.2, 15.85));
  g.add(hexFrame(44.4, 15.55, 2.15, 1.35, "#1a46b0"));
  g.add(hexFrame(33.2, 16.55, 1.35, 0.95, "#9a9488"));
  g.add(roofRibs(43.2, 17.5, 16.85));
  const well = new THREE.Mesh(
    new THREE.RingGeometry(16.4, 18.6, 6),
    mat("#2a2e34", { roughness: 0.4, side: THREE.DoubleSide }),
  );
  well.rotation.x = -Math.PI / 2;
  well.position.y = 16.05;
  g.add(well);
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(41.8, 44.2, 2.6, 48),
    mat("#b8b2a6", { roughness: 0.74 }),
  );
  plinth.position.y = 1.3;
  plinth.scale.set(1.18, 1, 1);
  plinth.castShadow = true;
  g.add(plinth);
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(41.2, 41.6, 1.15, 48, 1, true),
    mat("#3a4048", { roughness: 0.48, side: THREE.DoubleSide }),
  );
  belt.position.y = 3.35;
  belt.scale.set(1.18, 1, 1);
  g.add(belt);
  g.add(facadeColumns(40.6, 12.6, 18));
  g.add(ledRibbon(39.4, 9.4));
  g.add(hexFrame(38.8, 16.15, 1.05, 0.72, "#4a463e"));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 2;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(2.55, 13.8, 2.55), mat(WHITE, { roughness: 0.44 }));
    leg.position.set(Math.cos(a) * 42.2, 6.9, -Math.sin(a) * 42.2);
    leg.castShadow = true;
    g.add(leg);
  }
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(16, 0.42, 8.4), mat(ROOF, { roughness: 0.3 }));
  canopy.position.set(0, 5.1, 40);
  canopy.castShadow = true;
  g.add(canopy);
  const ramp = accessRamp(22, 4.4, 3.2);
  ramp.position.set(0, 0, 38);
  g.add(ramp);
  g.add(entryPortal(0, 41.2, 0));
  g.add(entryPortal(28, 30, -0.75));
  g.add(entryPortal(-28, 30, 0.75));
  return g;
}

/** Armstrong — kleineres Dach-Stadion plus nördlicher Anbau (Grounds Map). */
export function armstrongStadium(): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = "armstrong";
  const court = tennisCourt(14.2, 28.4);
  court.position.y = 0.04;
  g.add(court);
  const bowl = new THREE.Group();
  const r = 22.5;
  const bowlH = 10.8;
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 1.12, r * 1.22, bowlH, 48, 1, true),
    mat(WHITE, { side: THREE.DoubleSide, roughness: 0.5 }),
  );
  shell.position.y = bowlH / 2;
  shell.castShadow = true;
  bowl.add(shell);
  seatDecks(bowl, r, 4, bowlH, 48, "#2f5cb8", "#244a96");
  addSectionLabels(bowl, r * 0.72, 3.8, ["1", "5", "9", "13", "101", "107", "113", "119"]);
  bowl.scale.set(1.18, 1, 1);
  g.add(bowl);
  addOuterLabels(g, 32, 6.2, ["1", "5", "9", "13", "101", "107", "113", "119"]);
  g.add(roofWithHole(29.4, 22, 34, 11.2, 2.2, true));
  g.add(hexRim(29.4, 13.45));
  g.add(hexFrame(29.6, 13.25, 1.55, 0.95, "#1a46b0"));
  g.add(roofRibs(28.6, 12.4, 14.55));
  g.add(facadeColumns(27.2, 10.6, 14));
  g.add(ledRibbon(26.4, 7.8));
  const annex = new THREE.Mesh(new THREE.BoxGeometry(36, 8.4, 22), mat(WHITE, { roughness: 0.46 }));
  annex.position.set(0, 4.2, -30);
  annex.castShadow = true;
  const annexRoof = new THREE.Mesh(new THREE.BoxGeometry(37.4, 0.55, 23.4), mat(ROOF, { roughness: 0.3 }));
  annexRoof.position.set(0, 8.7, -30);
  g.add(annex, annexRoof);
  const ramp = accessRamp(16, 3.8, 2.6);
  ramp.position.set(-22, 0, 8);
  ramp.rotation.y = Math.PI / 2;
  g.add(ramp);
  return g;
}

/** Grandstand — offenes Oval wie auf der Grounds Map. */
export function grandstandHouse(): THREE.Group {
  return openBowl("grandstand", 21, 5, 1.28);
}

/** Stadium 17 — offenes Oval mit Nummer, gleiche Lesart wie Grandstand. */
export function pitCourt(): THREE.Group {
  return openBowl("court17", 19.5, 4, 1.26, "17");
}

export function pavilion(id: string, w: number, d: number, h: number, color: string): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = id;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, { roughness: 0.56 }));
  body.position.y = h / 2;
  body.castShadow = true;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 1.8, 0.4, d + 1.8), mat(ROOF, { roughness: 0.34 }));
  roof.position.y = h + 0.3;
  g.add(body, roof);
  return g;
}

const GATE_TITLE: Record<string, string> = {
  "south-gate": "Champion's Entry",
  "east-gate": "Main Entry",
  "president-gate": "President's Entry",
};

export function gateHouse(id = "south-gate"): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = id;
  for (const x of [-6.5, 6.5]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(1.7, 4.4, 1.7), mat(WHITE));
    post.position.set(x, 2.2, 0);
    g.add(post);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(15, 0.7, 1.5), mat("#1c1c1e"));
  beam.position.y = 4.55;
  g.add(beam);
  const title = GATE_TITLE[id];
  if (title) {
    const plate = labelPlate(title, 13.2, 1.35);
    plate.position.set(0, 5.45, 0.2);
    g.add(plate);
  }
  return g;
}

export function stationHouse(): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = "willets";
  const hall = new THREE.Mesh(new THREE.BoxGeometry(22, 8, 12), mat("#c5ccd2"));
  hall.position.y = 4;
  hall.castShadow = true;
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(36, 0.35, 10), mat("#8a9088", { metalness: 0.25 }));
  canopy.position.set(0, 6.2, 10);
  const plat = new THREE.Mesh(new THREE.BoxGeometry(36, 0.7, 8), mat("#8b8680"));
  plat.position.set(0, 0.4, 10);
  const seven = labelPlate("7", 2.6, 1.4);
  seven.position.set(-6, 8.6, 0);
  const lirr = labelPlate("LIRR", 4.8, 1.4);
  lirr.position.set(5, 8.6, 0);
  g.add(hall, canopy, plat, seven, lirr);
  return g;
}

export function unisphere(): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = "unisphere";
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(12, 36, 28),
    mat("#c5d0d6", { metalness: 0.68, roughness: 0.18 }),
  );
  ball.position.y = 14;
  ball.castShadow = true;
  const mer = new THREE.Mesh(
    new THREE.SphereGeometry(12.2, 20, 14),
    new THREE.MeshBasicMaterial({ color: "#6e808a", wireframe: true, transparent: true, opacity: 0.55 }),
  );
  mer.position.y = 14;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 6.4, 3, 12), mat("#9aa0a6"));
  base.position.y = 1.5;
  g.add(ball, mer, base);
  for (const r of [16, 20, 24]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.28, 6, 40),
      mat("#9aa8b0", { metalness: 0.4, roughness: 0.3 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.35;
    g.add(ring);
  }
  return g;
}

export function markedCourt(id: string, w: number, d: number): THREE.Group {
  const g = tennisCourt(w, d);
  g.userData.nodeId = id;
  return g;
}

/** Outer Court mit Nummer und weißen Tribünenblöcken (Grounds-Map-Lesart). */
export function numberedCourt(id: string, num: string): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = id;
  const yard = new THREE.Mesh(new THREE.BoxGeometry(22.4, 0.1, 38.6), mat("#1f6e28", { roughness: 0.9 }));
  yard.position.y = 0.14;
  yard.receiveShadow = true;
  g.add(yard);
  const apron = new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.08, 32.4), mat("#2f8a38", { roughness: 0.88 }));
  apron.position.y = 0.2;
  apron.receiveShadow = true;
  g.add(apron);
  const court = tennisCourt(11.4, 24.2, num);
  court.position.y = 0.16;
  g.add(court);
  g.add(whiteBank(16.8, 7.6, 3.35, 0, -16.4));
  g.add(whiteBank(16.8, 7.6, 3.35, 0, 16.4));
  g.add(whiteBank(3.6, 22.4, 2.55, -9.2, 0));
  g.add(whiteBank(3.6, 22.4, 2.55, 9.2, 0));
  const screen = mat("#1a3a28", { roughness: 0.7 });
  for (const z of [-12.4, 12.4]) {
    const fence = new THREE.Mesh(new THREE.BoxGeometry(12.2, 2.4, 0.08), screen);
    fence.position.set(0, 1.3, z);
    fence.castShadow = true;
    g.add(fence);
  }
  for (const x of [-10.6, 10.6]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.1, 18.4), screen);
    side.position.set(x, 1.15, 0);
    side.castShadow = true;
    g.add(side);
  }
  const hedge = new THREE.Mesh(new THREE.BoxGeometry(20.8, 0.85, 0.55), mat("#1c6a24", { roughness: 0.9 }));
  hedge.position.set(0, 0.52, 19.4);
  hedge.castShadow = true;
  g.add(hedge);
  const poleMat = mat("#c8c4ba", { roughness: 0.42 });
  const lampMat = mat("#f4f2eb", { roughness: 0.35, emissive: "#fff4c8", emissiveIntensity: 0.18 });
  for (const [x, z] of [[-7.4, -14.2], [7.4, -14.2], [-7.4, 14.2], [7.4, 14.2]] as const) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 10.4, 6), poleMat);
    pole.position.set(x, 5.2, z);
    pole.castShadow = true;
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.22, 0.5), lampMat);
    lamp.position.set(x, 10.5, z);
    g.add(pole, lamp);
  }
  return g;
}

/** Practice Courts 1–5 — Zahl laut Grounds Map / President's Entry. */
export function practiceYard(): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = "practice";
  const yard = new THREE.Mesh(new THREE.BoxGeometry(86, 0.1, 42), mat("#1f6e28", { roughness: 0.9 }));
  yard.position.y = 0.12;
  yard.receiveShadow = true;
  g.add(yard);
  const screen = mat("#1a3a28", { roughness: 0.7 });
  for (let i = 0; i < 5; i++) {
    const x = -32 + i * 16;
    const c = tennisCourt(11.2, 23.8, String(i + 1));
    c.position.set(x, 0.12, 0);
    g.add(c);
    g.add(whiteBank(12.4, 5.8, 2.6, x, -15.2));
    if (i < 4) {
      const fence = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 22), screen);
      fence.position.set(x + 8, 1.2, 0);
      fence.castShadow = true;
      g.add(fence);
    }
  }
  return g;
}

/** Lot A / Lot B — offizielle Parkplätze, stilisiert, kein GPS. */
export function parkingLot(id: string, letter: string): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = id;
  const floor = new THREE.Mesh(new THREE.BoxGeometry(52, 0.1, 36), mat("#c8c6c0", { roughness: 0.86 }));
  floor.position.y = 0.08;
  floor.receiveShadow = true;
  g.add(floor);
  const cars = ["#2a3a5c", "#c43c3c", "#f4f2eb", "#3a3f4a", "#2a7ab8", "#d8d4cc"];
  for (let i = -4; i <= 4; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 8.4), mat(LINE));
    line.position.set(i * 5.1, 0.16, -8);
    g.add(line);
    if (i % 2 === 0) continue;
    const car = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.72, 4.4), mat(cars[(i + 4) % cars.length], { roughness: 0.42 }));
    car.position.set(i * 5.1, 0.48, -8);
    car.castShadow = true;
    g.add(car);
  }
  const plate = labelPlate(`Lot ${letter}`, 10.4, 2.4);
  plate.rotation.x = -Math.PI / 2;
  plate.position.set(0, 0.2, 6);
  g.add(plate);
  return g;
}

/** New York State Pavilion — Getting There / Rideshare, stilisiert. */
export function nysPavilion(): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = "nys-pavilion";
  for (const x of [-11, 11]) {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.45, 28, 10), mat("#d8d2c6", { roughness: 0.42 }));
    tower.position.set(x, 14, 0);
    tower.castShadow = true;
    g.add(tower);
  }
  const tent = new THREE.Mesh(
    new THREE.TorusGeometry(16, 0.55, 8, 40),
    mat("#c8c4ba", { roughness: 0.38 }),
  );
  tent.rotation.x = Math.PI / 2;
  tent.position.y = 7.2;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(15, 36), mat("#efece4", { roughness: 0.86 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.1;
  const plate = labelPlate("NY State Pavilion", 14, 1.7);
  plate.position.set(0, 22, 0);
  g.add(tent, floor, plate);
  return g;
}

/** Citi Field — Nachbar laut Grounds Map (Mets Stadium Parking), kein CAD. */
export function citiField(): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = "citi-field";
  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(38, 44, 16, 40, 1, true),
    mat("#c47848", { side: THREE.DoubleSide, roughness: 0.55 }),
  );
  bowl.position.y = 8;
  bowl.castShadow = true;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(41, 1.4, 8, 40), mat("#d8d2c6", { roughness: 0.4 }));
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 16;
  const field = new THREE.Mesh(new THREE.CircleGeometry(22, 36), mat("#46ad3e", { roughness: 0.7 }));
  field.rotation.x = -Math.PI / 2;
  field.position.y = 0.12;
  const plate = labelPlate("Citi Field", 16, 2.2);
  plate.rotation.x = -Math.PI / 2;
  plate.position.set(0, 0.22, 0);
  g.add(bowl, lip, field, plate);
  return g;
}

/** Taxi / Rideshare am Champion's Entry — Getting-There-Text, keine Minuten. */
export function rideshareCanopy(): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = "rideshare";
  const floor = new THREE.Mesh(new THREE.BoxGeometry(22, 0.1, 12), mat("#d8d6d0", { roughness: 0.8 }));
  floor.position.y = 0.08;
  const postL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.2, 0.35), mat(WHITE));
  postL.position.set(-8, 2.1, 0);
  const postR = postL.clone();
  postR.position.x = 8;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(20, 0.28, 8), mat(ROOF, { roughness: 0.34 }));
  roof.position.y = 4.3;
  const plate = labelPlate("Rideshare", 8.4, 1.4);
  plate.position.set(0, 4.7, 0);
  g.add(floor, postL, postR, roof, plate);
  return g;
}

/** Food Village — offene Plaza mit Schirmen, kein Hallen-Klotz, keine Standnamen. */
export function foodHall(): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = "food-village";
  const floor = new THREE.Mesh(new THREE.BoxGeometry(52, 0.12, 38), mat("#efe8dc", { roughness: 0.82 }));
  floor.position.y = 0.08;
  floor.receiveShadow = true;
  g.add(floor);
  const hall = new THREE.Mesh(new THREE.BoxGeometry(18, 4.6, 10), mat(WHITE, { roughness: 0.48 }));
  hall.position.set(0, 2.3, 0);
  hall.castShadow = true;
  const hallRoof = new THREE.Mesh(new THREE.BoxGeometry(20.4, 0.36, 12.2), mat(ROOF, { roughness: 0.32 }));
  hallRoof.position.set(0, 4.75, 0);
  hallRoof.castShadow = true;
  const awning = new THREE.Mesh(new THREE.BoxGeometry(19.2, 0.12, 3.4), mat("#1a46b0", { roughness: 0.4 }));
  awning.position.set(0, 3.55, 6.4);
  g.add(hall, hallRoof, awning);
  const colors = ["#d94a4a", "#2176e8", "#f3eee4", "#d94a4a"];
  for (let i = 0; i < 8; i++) {
    const x = -18 + (i % 4) * 12;
    const z = i < 4 ? -12 : 12;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.4, 6), mat("#8a8074"));
    pole.position.set(x, 1.7, z);
    const umb = new THREE.Mesh(new THREE.ConeGeometry(4.4, 0.62, 12), mat(colors[i % 4], { roughness: 0.46 }));
    umb.position.set(x, 3.55, z);
    umb.castShadow = true;
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.12, 12), mat(WHITE));
    table.position.set(x, 0.74, z);
    const chairA = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.46, 0.42), mat("#d8d2c6"));
    chairA.position.set(x - 1.05, 0.28, z);
    const chairB = chairA.clone();
    chairB.position.set(x + 1.05, 0.28, z);
    g.add(pole, umb, table, chairA, chairB);
  }
  const plate = labelPlate("Food Village", 16, 2.2);
  plate.rotation.x = -Math.PI / 2;
  plate.position.set(0, 0.22, 16);
  g.add(plate);
  for (const [x, z] of [[-22, -16], [22, -16], [-22, 16], [22, 16]] as const) {
    const hut = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.1, 4.2), mat(WHITE, { roughness: 0.5 }));
    hut.position.set(x, 1.55, z);
    hut.castShadow = true;
    const top = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.22, 4.6), mat(ROOF, { roughness: 0.34 }));
    top.position.set(x, 3.2, z);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.28, 0.12), mat("#1a46b0", { roughness: 0.4 }));
    stripe.position.set(x, 2.35, z + (z > 0 ? 2.16 : -2.16));
    g.add(hut, top, stripe);
  }
  const potMat = mat("#6a5340", { roughness: 0.8 });
  const leafMat = mat("#22822c", { roughness: 0.9 });
  for (const [x, z] of [[-8, -5], [8, -5], [-8, 5], [8, 5]] as const) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, 0.62, 8), potMat);
    pot.position.set(x, 0.42, z);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.72, 8, 6), leafMat);
    leaf.position.set(x, 1.08, z);
    leaf.castShadow = true;
    g.add(pot, leaf);
  }
  return g;
}

/** South Plaza / Sculpture Garden — Kreis in der Hex-Plaza. */
export function plazaMark(): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = "south-plaza";
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(7.6, 0.58, 8, 40),
    mat("#d8d2c6", { roughness: 0.4 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.42;
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(6.5, 36),
    mat("#4e9bb4", { roughness: 0.16, metalness: 0.24 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.18;
  g.add(ring, water);
  const spray = mat("#c8e8f2", { roughness: 0.08, transparent: true, opacity: 0.52 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const jet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.035, 1.15 + (i % 3) * 0.35, 5),
      spray,
    );
    jet.position.set(Math.cos(a) * 2.15, 0.85 + (i % 3) * 0.12, Math.sin(a) * 2.15);
    g.add(jet);
  }
  return g;
}

export function outerCourtNum(id: string): string | null {
  const m = /^court(\d+)$/.exec(id);
  if (!m || m[1] === "17") return null;
  return m[1];
}

const AMENITY_COLOR: Record<string, string> = {
  restroom: "#2b6bff",
  firstaid: "#e24b4b",
  water: "#2a9bb8",
  info: "#1c1c1e",
  access: "#5a46d6",
  baggage: "#6a5340",
  lostfound: "#c47a14",
  atm: "#1a7a4c",
  charger: "#0b6e99",
  boxoffice: "#1c1c1e",
};

/** Kleines Amenity-Häuschen — Toilette, Erste Hilfe, Wasser, Info. */
export function amenityHut(id: string, kind: string): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = id;
  const ink = AMENITY_COLOR[kind] ?? "#2b6bff";
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.1, 3.2, 3.1), mat(WHITE, { roughness: 0.5 }));
  body.position.y = 1.6;
  body.castShadow = true;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.28, 3.5), mat(ROOF, { roughness: 0.34 }));
  roof.position.y = 3.3;
  const badge = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.35, 0.12), mat(ink, { roughness: 0.4 }));
  badge.position.set(0, 2.15, 1.62);
  g.add(body, roof, badge);
  if (kind === "water") {
    const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8), mat("#8aa0a8"));
    tap.position.set(0, 1.05, 1.7);
    g.add(tap);
  }
  return g;
}
