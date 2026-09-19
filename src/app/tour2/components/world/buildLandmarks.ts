/**
 * Bauten nach der US-Open-Grounds-Map, mit mehr Tiefe als die offizielle 2.5D-Karte:
 * massives weißes Ashe-Dach, volle weiße Tribünenblöcke, nummerierte Outer Courts.
 * Spiel-Geometrie — kein CAD, keine erfundenen Innenräume oder Standnamen.
 */

import * as THREE from "three";

const COURT = "#2176e8";
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
      new THREE.CircleGeometry(1.7, 28),
      new THREE.MeshBasicMaterial({ map: numberTex(badge) }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.23;
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
    ctx.font = "700 72px system-ui, sans-serif";
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

function roofWithHole(r: number, holeW: number, holeD: number, y: number, thick = 2.35): THREE.Mesh {
  const shape = hexShape(r);
  const hole = new THREE.Path();
  hole.moveTo(-holeW / 2, -holeD / 2);
  hole.lineTo(holeW / 2, -holeD / 2);
  hole.lineTo(holeW / 2, holeD / 2);
  hole.lineTo(-holeW / 2, holeD / 2);
  hole.closePath();
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false });
  const m = new THREE.Mesh(geo, mat(ROOF, { roughness: 0.28, metalness: 0.1 }));
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

function seatDecks(bowl: THREE.Group, r: number, tiers: number, bowlH: number, segs = 56): void {
  const seatGeo = new THREE.BoxGeometry(0.72, 0.52, 0.58);
  const seatMats = [
    mat("#efebe3", { roughness: 0.48 }),
    mat("#d8d2c6", { roughness: 0.48 }),
  ];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < tiers; i++) {
    const inner = r * (0.5 + i * 0.15);
    const outer = inner + r * 0.148;
    const y = 0.95 + i * (bowlH / (tiers + 0.2));
    const deck = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, segs),
      mat(i % 2 ? SEAT : SEAT_ALT, { roughness: 0.48, side: THREE.DoubleSide }),
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
  seatDecks(bowl, r, tiers, bowlH);
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(r * 1.18, 0.95, 8, 56),
    mat(WHITE, { roughness: 0.34 }),
  );
  lip.rotation.x = Math.PI / 2;
  lip.position.y = bowlH;
  bowl.add(lip);
  bowl.scale.set(ovalX, 1, 1);
  g.add(bowl);
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
    mat(WALL, { side: THREE.DoubleSide, roughness: 0.58 }),
  );
  shell.position.y = bowlH / 2;
  shell.castShadow = true;
  bowl.add(shell);
  seatDecks(bowl, r, 5, bowlH, 64);
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
  fascia.material = mat(WALL, { roughness: 0.52 });
  g.add(fascia);
  g.add(roofWithHole(44.2, 32, 44, 13.2, 2.6));
  g.add(hexRim(44.2, 15.85));
  const ramp = accessRamp(22, 4.4, 3.2);
  ramp.position.set(0, 0, 38);
  g.add(ramp);
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
    mat(WALL, { side: THREE.DoubleSide, roughness: 0.6 }),
  );
  shell.position.y = bowlH / 2;
  shell.castShadow = true;
  bowl.add(shell);
  seatDecks(bowl, r, 4, bowlH, 48);
  addSectionLabels(bowl, r * 0.72, 3.8, ["1", "5", "9", "13", "101", "107", "113", "119"]);
  bowl.scale.set(1.18, 1, 1);
  g.add(bowl);
  addOuterLabels(g, 32, 6.2, ["1", "5", "9", "13", "101", "107", "113", "119"]);
  g.add(roofWithHole(29.4, 22, 34, 11.2, 2.2));
  g.add(hexRim(29.4, 13.45));
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
  g.add(tennisCourt(11.4, 24.2, num));
  g.add(whiteBank(16.8, 7.6, 3.35, 0, -16.4));
  g.add(whiteBank(16.8, 7.6, 3.35, 0, 16.4));
  return g;
}

/** Practice Courts 1–5 — Zahl laut Grounds Map / President's Entry. */
export function practiceYard(): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = "practice";
  for (let i = 0; i < 5; i++) {
    const x = -32 + i * 16;
    const c = tennisCourt(11.2, 23.8, String(i + 1));
    c.position.x = x;
    g.add(c);
    g.add(whiteBank(12.4, 5.8, 2.6, x, -15.2));
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
  for (let i = -4; i <= 4; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 8.4), mat(LINE));
    line.position.set(i * 5.1, 0.16, -8);
    g.add(line);
  }
  const plate = labelPlate(`Lot ${letter}`, 10.4, 2.4);
  plate.rotation.x = -Math.PI / 2;
  plate.position.set(0, 0.2, 6);
  g.add(plate);
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
  const floor = new THREE.Mesh(new THREE.BoxGeometry(46, 0.12, 34), mat("#f2f0ea", { roughness: 0.8 }));
  floor.position.y = 0.08;
  floor.receiveShadow = true;
  g.add(floor);
  const colors = ["#d94a4a", "#2176e8", "#f3eee4", "#d94a4a"];
  for (let i = 0; i < 8; i++) {
    const x = -15 + (i % 4) * 10;
    const z = i < 4 ? -7 : 8;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.9, 6), mat("#8a8074"));
    pole.position.set(x, 1.45, z);
    const umb = new THREE.Mesh(new THREE.ConeGeometry(3.2, 0.48, 12), mat(colors[i % 4], { roughness: 0.46 }));
    umb.position.set(x, 3.05, z);
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.12, 12), mat(WHITE));
    table.position.set(x, 0.74, z);
    g.add(pole, umb, table);
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
