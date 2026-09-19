/**
 * Gelände nach der US-Open-Grounds-Map: Gras mit Streuung, Plaza,
 * Hexagon um Ashe, Bäume, Fahnen, Bänke. Wege sind Plaza, kein Asphalt.
 */

import * as THREE from "three";
import type { SiteWorld } from "@/domain/tour/siteWorld";
import { nodeById, pushOffFootprints } from "@/domain/tour/siteWorld";

const GRASS = "#24802c";
const GRASS_DARK = "#1a5c20";
const PLAZA = "#e2d6c2";
const WALK = "#d8ccb6";
const STREET = "#d8d6d0";
const ROUTE = "#2b6bff";

const texCache = new Map<string, THREE.CanvasTexture>();

function speckTex(a: string, b: string, repeat: number): THREE.CanvasTexture {
  const key = `${a}|${b}|${repeat}`;
  const hit = texCache.get(key);
  if (hit) return hit;
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = a;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 2800; i++) {
      ctx.fillStyle = i % 3 === 0 ? b : a;
      ctx.globalAlpha = 0.28 + (i % 6) * 0.1;
      ctx.fillRect((i * 17) % size, (i * 31) % size, 3 + (i % 6), 2 + (i % 5));
    }
    ctx.globalAlpha = 1;
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  texCache.set(key, tex);
  return tex;
}

function mat(color: string, roughness = 0.88, map?: THREE.Texture): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, map });
}

function grassMat(tint: string, dark: string, repeat: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.94,
    map: speckTex(tint, dark, repeat),
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
}

export function disk(r: number, color: string, y = 0.02, material?: THREE.MeshStandardMaterial): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 72), material ?? mat(color, 0.94));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.receiveShadow = true;
  return m;
}

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
  const m = new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, len + 0.4), mat(color, 0.8));
  m.position.set((ax + bx) / 2, y, (az + bz) / 2);
  m.rotation.y = Math.atan2(dx, dz);
  m.receiveShadow = true;
  return m;
}

export function pad(x: number, z: number, w: number, d: number, color: string, y = 0.06): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), mat(color, 0.86));
  m.position.set(x, y, z);
  m.receiveShadow = true;
  return m;
}

function hexTileTex(): THREE.CanvasTexture {
  const key = "hex-tile";
  const hit = texCache.get(key);
  if (hit) return hit;
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#d8cbb4";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "#9a8c74";
    ctx.lineWidth = 7;
    const s = 28;
    const h = s * Math.sqrt(3);
    for (let row = -1; row < 12; row++) {
      for (let col = -1; col < 12; col++) {
        const ox = col * s * 1.5 + (row % 2 === 0 ? 0 : s * 0.75);
        const oy = row * (h * 0.5);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const x = ox + Math.cos(a) * s * 0.52;
          const y = oy + Math.sin(a) * s * 0.52;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  texCache.set(key, tex);
  return tex;
}

function hexPad(r: number, y: number): THREE.Mesh {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const yy = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, yy);
    else shape.lineTo(x, yy);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false });
  const m = new THREE.Mesh(geo, mat("#ffffff", 0.84, hexTileTex()));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.receiveShadow = true;
  return m;
}

function ringPad(inner: number, outer: number, y: number, color: string): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 64), mat(color, 0.8));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.receiveShadow = true;
  return m;
}

/** Straßenname auf dem Belag — wie auf der offiziellen Grounds Map, nur belegte Namen. */
function streetSign(text: string, x: number, z: number, rotY: number): THREE.Mesh {
  const c = document.createElement("canvas");
  c.width = 1280;
  c.height = 160;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 1280, 160);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(0, 28, 1280, 104);
    ctx.fillStyle = "#2a2a2a";
    ctx.font = "800 72px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 640, 84);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(118, 22 + text.length * 2.35), 6.4),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }),
  );
  m.rotation.x = -Math.PI / 2;
  m.rotation.z = rotY;
  m.position.set(x, 0.2, z);
  return m;
}

/** Aufrechter Wegweiser an Kreuzungen — kein GPS, nur offizielle Straßennamen. */
function wayTotem(lines: string[], x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.16, 5.2, 6),
    mat("#c8c4ba", 0.45),
  );
  pole.position.y = 2.6;
  g.add(pole);
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 220;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#1a46b0";
    ctx.fillRect(0, 0, 512, 220);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 36px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    lines.forEach((line, i) => ctx.fillText(line, 256, 70 + i * 48));
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(7.6, 3.3),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }),
  );
  plate.position.set(0, 5.1, 0);
  g.add(plate);
  g.position.set(x, 0, z);
  return g;
}

function plantTrees(scene: THREE.Scene, spots: [number, number, number?][]): void {
  const crownGeo = new THREE.SphereGeometry(1.75, 8, 6);
  const crownMat = new THREE.MeshStandardMaterial({ roughness: 0.92 });
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.28, 2.2, 6);
  const trunkMat = mat("#6a5340", 0.88);
  const blobs = spots.length * 3;
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, blobs);
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, spots.length);
  crowns.castShadow = true;
  crowns.receiveShadow = true;
  trunks.castShadow = true;
  const dummy = new THREE.Object3D();
  const ink = new THREE.Color();
  const LEAF = ["#1f7a28", "#2a8c32", "#176622", "#24802c"];
  spots.forEach(([x, z, s], i) => {
    const sc = (s ?? 1) * 1.45;
    const shade = new THREE.Mesh(
      new THREE.CircleGeometry(2.4 * sc, 12),
      mat("#1a4a1e", 0.96),
    );
    shade.rotation.x = -Math.PI / 2;
    shade.position.set(x, 0.14, z);
    shade.receiveShadow = false;
    shade.castShadow = false;
    scene.add(shade);
    dummy.position.set(x, 1.1 * sc, z);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    for (let k = 0; k < 3; k++) {
      const idx = i * 3 + k;
      dummy.position.set(
        x + (k - 1) * 0.85 * sc,
        (2.55 + (k % 2) * 0.55) * sc,
        z + (k === 2 ? 0.38 : -0.18) * sc,
      );
      dummy.scale.set(sc * (1.05 + k * 0.12), sc * (0.88 + k * 0.08), sc * (1.0 + k * 0.1));
      dummy.updateMatrix();
      crowns.setMatrixAt(idx, dummy.matrix);
      ink.set(LEAF[(i + k) % LEAF.length]);
      crowns.setColorAt(idx, ink);
    }
  });
  if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
  scene.add(trunks, crowns);
}

function plantLamps(scene: THREE.Scene, spots: [number, number][]): THREE.MeshStandardMaterial {
  const pole = new THREE.CylinderGeometry(0.09, 0.12, 4.2, 6);
  const head = new THREE.SphereGeometry(0.28, 8, 6);
  const poles = new THREE.InstancedMesh(pole, mat("#c8c4ba", 0.45), spots.length);
  const headMat = new THREE.MeshStandardMaterial({
    color: "#fff6d8",
    roughness: 0.35,
    emissive: "#fff2c0",
    emissiveIntensity: 0.04,
  });
  const heads = new THREE.InstancedMesh(head, headMat, spots.length);
  const dummy = new THREE.Object3D();
  spots.forEach(([x, z], i) => {
    dummy.position.set(x, 2.1, z);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    poles.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, 4.35, z);
    dummy.updateMatrix();
    heads.setMatrixAt(i, dummy.matrix);
  });
  scene.add(poles, heads);
  return headMat;
}

function flagTex(kind: "us" | "blue"): THREE.CanvasTexture {
  const key = `flag:${kind}`;
  const hit = texCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 144;
  const ctx = c.getContext("2d");
  if (ctx) {
    if (kind === "us") {
      for (let i = 0; i < 13; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#bf0a30" : "#ffffff";
        ctx.fillRect(0, i * 11, 256, 12);
      }
      ctx.fillStyle = "#002868";
      ctx.fillRect(0, 0, 110, 78);
    } else {
      ctx.fillStyle = "#1a46b0";
      ctx.fillRect(0, 0, 256, 144);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(18, 62, 220, 18);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, tex);
  return tex;
}

/** Fahnen entlang der Avenues — stilisiert, kein Marken-Claim. */
function plantFlags(scene: THREE.Scene, spots: [number, number][]): (t: number) => void {
  const cloths: THREE.Mesh[] = [];
  spots.forEach(([x, z], i) => {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 7.2, 6), mat("#c8c4ba", 0.4));
    pole.position.y = 3.6;
    pole.castShadow = true;
    const cloth = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 1.45),
      new THREE.MeshStandardMaterial({
        map: flagTex(i % 3 === 0 ? "us" : "blue"),
        side: THREE.DoubleSide,
        roughness: 0.55,
      }),
    );
    cloth.position.set(1.3, 6.2, 0);
    cloth.castShadow = true;
    g.add(pole, cloth);
    g.position.set(x, 0, z);
    scene.add(g);
    cloths.push(cloth);
  });
  return (t) => {
    cloths.forEach((m, i) => {
      m.rotation.y = Math.sin(t * 2.1 + i) * 0.28;
    });
  };
}

function bench(x: number, z: number, rotY: number): THREE.Group {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.62), mat("#c4b49a", 0.7));
  seat.position.y = 0.52;
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.62, 0.12), mat("#b8a888", 0.7));
  back.position.set(0, 0.88, -0.28);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.5), mat("#8a8074"));
  legL.position.set(-1, 0.25, 0);
  const legR = legL.clone();
  legR.position.x = 1;
  g.add(seat, back, legL, legR);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  return g;
}

const SHIRT = ["#1e3a7a", "#f4f2eb", "#c43c3c", "#2a7ab8", "#e8c84a", "#2d6b3a", "#d8d4cc", "#6a3a8a"];
const PANT = ["#2a2e38", "#3a3f4a", "#1e3a5c", "#4a4038", "#2d4a38"];

function faceTex(): THREE.CanvasTexture {
  const hit = texCache.get("face");
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#3a2a22";
    ctx.fillRect(0, 0, 128, 40);
    ctx.fillStyle = "#e0b090";
    ctx.fillRect(0, 36, 128, 92);
    ctx.fillStyle = "#2a221c";
    ctx.beginPath();
    ctx.ellipse(46, 68, 6, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(82, 68, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4f2eb";
    ctx.beginPath();
    ctx.ellipse(47, 68, 2.2, 2.4, 0, 0, Math.PI * 2);
    ctx.ellipse(83, 68, 2.2, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#a06a50";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(64, 86, 10, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  texCache.set("face", tex);
  return tex;
}

type WalkSeg = { ax: number; az: number; bx: number; bz: number };

const HUBS: { id: string; n: number; r: number }[] = [
  { id: "food-village", n: 28, r: 16 },
  { id: "south-gate", n: 16, r: 11 },
  { id: "south-plaza", n: 24, r: 18 },
  { id: "east-gate", n: 12, r: 11 },
  { id: "president-gate", n: 8, r: 10 },
  { id: "lot-b", n: 8, r: 12 },
];

/** Besucher auf Wegen und an Plaza/Food/Gates — stilisiert, keine erfundenen Personen. */
export function plantWalkers(scene: THREE.Scene, world: SiteWorld): (dt: number, t: number) => void {
  const segs: WalkSeg[] = [];
  for (const p of world.paths) {
    const a = nodeById(world, p.from);
    const b = nodeById(world, p.to);
    if (!a || !b) continue;
    if (Math.hypot(b.x - a.x, b.z - a.z) < 10) continue;
    const ca = pushOffFootprints(world, a.x, a.z);
    const cb = pushOffFootprints(world, b.x, b.z);
    if (Math.hypot(cb.x - ca.x, cb.z - ca.z) < 10) continue;
    segs.push({ ax: ca.x, az: ca.z, bx: cb.x, bz: cb.z });
  }
  if (segs.length === 0) return () => { /* keine Wege */ };
  const gate = nodeById(world, "south-gate");
  const prefer = gate
    ? segs
      .map((s, i) => ({ s, i, d: Math.min(Math.hypot(s.ax - gate.x, s.az - gate.z), Math.hypot(s.bx - gate.x, s.bz - gate.z)) }))
      .filter((row) => row.d < 90)
      .map((row) => row.i)
    : [];

  type Person = {
    mode: "walk" | "stand";
    seg: number;
    u: number;
    speed: number;
    flip: number;
    scale: number;
    hx: number;
    hz: number;
    yaw: number;
  };
  const walkN = 118;
  const stands: Person[] = [];
  for (const hub of HUBS) {
    const n = nodeById(world, hub.id);
    if (!n) continue;
    for (let k = 0; k < hub.n; k++) {
      const a = k * 2.399 + hub.n;
      const rr = 3.2 + (k % 6) * (hub.r / 6);
      const parked = pushOffFootprints(world, n.x + Math.cos(a) * rr, n.z + Math.sin(a) * rr);
      stands.push({
        mode: "stand",
        seg: 0,
        u: 0,
        speed: 0,
        flip: 1,
        scale: 1.22 + (k % 5) * 0.07,
        hx: parked.x,
        hz: parked.z,
        yaw: a + Math.PI,
      });
    }
  }
  const walks: Person[] = Array.from({ length: walkN }, (_, i) => ({
    mode: "walk" as const,
    seg: prefer.length && i % 3 === 0 ? prefer[i % prefer.length] : i % segs.length,
    u: (i * 0.137) % 1,
    speed: 0.075 + (i % 7) * 0.013,
    flip: i % 2 === 0 ? 1 : -1,
    scale: 1.22 + (i % 5) * 0.07,
    hx: 0,
    hz: 0,
    yaw: 0,
  }));
  const state = walks.concat(stands);
  const n = state.length;

  const body = new THREE.InstancedMesh(
    new THREE.CapsuleGeometry(0.18, 0.42, 3, 6),
    new THREE.MeshStandardMaterial({ roughness: 0.62 }),
    n,
  );
  const head = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.145, 8, 6),
    new THREE.MeshStandardMaterial({ color: "#e0b090", roughness: 0.7 }),
    n,
  );
  const face = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.28, 0.3),
    new THREE.MeshStandardMaterial({ map: faceTex(), roughness: 0.55, side: THREE.DoubleSide }),
    n,
  );
  const hair = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.15, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ roughness: 0.72 }),
    n,
  );
  const leg = new THREE.InstancedMesh(
    new THREE.CapsuleGeometry(0.065, 0.34, 2, 5),
    new THREE.MeshStandardMaterial({ roughness: 0.7 }),
    n,
  );
  const legR = new THREE.InstancedMesh(
    new THREE.CapsuleGeometry(0.065, 0.34, 2, 5),
    new THREE.MeshStandardMaterial({ roughness: 0.7 }),
    n,
  );
  body.castShadow = false;
  head.castShadow = false;
  face.castShadow = false;
  hair.castShadow = false;
  leg.castShadow = false;
  legR.castShadow = false;
  const dummy = new THREE.Object3D();
  const ink = new THREE.Color();
  state.forEach((_, i) => {
    ink.set(SHIRT[i % SHIRT.length]);
    body.setColorAt(i, ink);
    ink.set(PANT[i % PANT.length]);
    leg.setColorAt(i, ink);
    legR.setColorAt(i, ink);
    ink.set(["#2a221c", "#3a2a22", "#1a1410", "#5a3a20", "#2c2c2c"][i % 5]);
    hair.setColorAt(i, ink);
  });
  if (body.instanceColor) body.instanceColor.needsUpdate = true;
  if (leg.instanceColor) leg.instanceColor.needsUpdate = true;
  if (legR.instanceColor) legR.instanceColor.needsUpdate = true;
  if (hair.instanceColor) hair.instanceColor.needsUpdate = true;
  scene.add(body, head, face, hair, leg, legR);

  return (dt: number, t: number) => {
    state.forEach((s, i) => {
      let x = s.hx;
      let z = s.hz;
      let yaw = s.yaw;
      let bob = 0;
      let stride = 0;
      if (s.mode === "walk") {
        s.u += s.speed * dt;
        if (s.u > 1) {
          s.u = 0;
          s.seg = (s.seg + 1 + (i % 3)) % segs.length;
        }
        const g = segs[s.seg];
        const fromX = s.flip > 0 ? g.ax : g.bx;
        const fromZ = s.flip > 0 ? g.az : g.bz;
        const toX = s.flip > 0 ? g.bx : g.ax;
        const toZ = s.flip > 0 ? g.bz : g.az;
        const rawX = fromX + (toX - fromX) * s.u;
        const rawZ = fromZ + (toZ - fromZ) * s.u;
        const clear = pushOffFootprints(world, rawX, rawZ);
        x = clear.x;
        z = clear.z;
        yaw = Math.atan2(toX - fromX, toZ - fromZ);
        bob = Math.sin(t * 9 + i) * 0.04;
        stride = Math.sin(t * 8.2 + i) * 0.16;
      } else {
        yaw = s.yaw + Math.sin(t * 0.4 + i) * 0.12;
        bob = Math.sin(t * 1.6 + i) * 0.012;
      }
      const sc = s.scale;
      const fx = Math.sin(yaw);
      const fz = Math.cos(yaw);
      dummy.position.set(x, 0.72 * sc + bob, z);
      dummy.scale.setScalar(sc);
      dummy.rotation.set(0, yaw, 0);
      dummy.updateMatrix();
      body.setMatrixAt(i, dummy.matrix);
      dummy.position.y += 0.42 * sc;
      dummy.updateMatrix();
      head.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x + fx * 0.15 * sc, 0.72 * sc + bob + 0.42 * sc, z + fz * 0.15 * sc);
      dummy.updateMatrix();
      face.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, 0.72 * sc + bob + 0.5 * sc, z);
      dummy.updateMatrix();
      hair.setMatrixAt(i, dummy.matrix);
      const side = 0.09 * sc;
      dummy.scale.set(sc, sc, sc);
      dummy.rotation.set(0, yaw, 0);
      dummy.position.set(x - fz * side + fx * stride, 0.3 * sc, z + fx * side + fz * stride);
      dummy.updateMatrix();
      leg.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x + fz * side - fx * stride, 0.3 * sc, z - fx * side - fz * stride);
      dummy.updateMatrix();
      legR.setMatrixAt(i, dummy.matrix);
    });
    body.instanceMatrix.needsUpdate = true;
    head.instanceMatrix.needsUpdate = true;
    face.instanceMatrix.needsUpdate = true;
    hair.instanceMatrix.needsUpdate = true;
    leg.instanceMatrix.needsUpdate = true;
    legR.instanceMatrix.needsUpdate = true;
  };
}

export function buildCampus(scene: THREE.Scene, world: SiteWorld): {
  lampHeads: THREE.MeshStandardMaterial;
  tickFlags: (t: number) => void;
} {
  const base = disk(340, GRASS_DARK, 0, grassMat(GRASS_DARK, "#1a5520", 28));
  base.receiveShadow = false;
  scene.add(base);
  const mid = disk(280, GRASS, 0.04, grassMat(GRASS, "#1e6e24", 22));
  mid.receiveShadow = false;
  scene.add(mid);
  scene.add(disk(118, "#3d9a38", 0.08, grassMat("#3d9a38", "#247a2c", 12)));
  const patches: [number, number, number, string, string][] = [
    [72, 110, 18, "#1f6a24", "#145018"],
    [-80, 90, 16, "#2a8a32", "#1a6020"],
    [140, 70, 20, "#1e6224", "#164818"],
    [-120, -40, 22, "#267828", "#185820"],
    [40, -90, 14, "#2c8c34", "#1c6424"],
    [180, -20, 18, "#216a26", "#15501c"],
    [0, 88, 26, "#2a8a32", "#1a6422"],
    [28, 70, 14, "#267828", "#185820"],
    [-26, 72, 13, "#2c8c34", "#1c6424"],
    [16, 108, 12, "#1f6a24", "#145018"],
  ];
  for (const [x, z, r, a, b] of patches) {
    const m = disk(r, a, 0.11, grassMat(a, b, 6));
    m.position.set(x, 0.11, z);
    m.receiveShadow = false;
    scene.add(m);
  }
  scene.add(hexPad(80, 0.16));
  scene.add(hexPad(46, 0.18));
  scene.add(ringPad(47.2, 53.6, 0.2, WALK));
  const plazaRing = ringPad(9.2, 13.6, 0.21, WALK);
  plazaRing.position.set(0, 0.21, 58);
  scene.add(plazaRing);
  scene.add(strip(0, 42, 0, 118, 10.4, WALK, 0.22));
  scene.add(strip(-28, 58, 28, 58, 7.2, WALK, 0.22));
  const campusFloor = [
    [0, 58, 72, 38],
    [78, -8, 58, 42],
    [-68, 12, 48, 36],
  ] as const;
  for (const [x, z, w, d] of campusFloor) {
    const p = pad(x, z, w, d, PLAZA, 0.17);
    (p.material as THREE.MeshStandardMaterial).map = speckTex(PLAZA, "#c4bba8", 8);
    (p.material as THREE.MeshStandardMaterial).color.set("#ffffff");
    (p.material as THREE.MeshStandardMaterial).needsUpdate = true;
    scene.add(p);
  }
  const north = streetSign("N", 0, -205, 0);
  scene.add(north);

  const plazaAt: Record<string, [number, number]> = {
    "food-village": [50, 38],
    armstrong: [68, 50],
    grandstand: [54, 46],
    court17: [50, 42],
    practice: [78, 36],
  };
  for (const [id, [w, d]] of Object.entries(plazaAt)) {
    const n = nodeById(world, id);
    if (n) {
      const p = pad(n.x, n.z, w, d, PLAZA, 0.17);
      (p.material as THREE.MeshStandardMaterial).map = speckTex(PLAZA, "#c4bba8", 4);
      (p.material as THREE.MeshStandardMaterial).color.set("#ffffff");
      (p.material as THREE.MeshStandardMaterial).needsUpdate = true;
      scene.add(p);
    }
  }

  const gate = nodeById(world, "south-gate");
  if (gate) scene.add(pad(gate.x, gate.z - 18, 230, 22, STREET, 0.16));
  const arm = nodeById(world, "armstrong");
  if (arm) scene.add(pad(arm.x, arm.z - 28, 96, 14, STREET, 0.16));
  const main = nodeById(world, "east-gate");
  if (main) scene.add(pad(main.x + 8, main.z, 16, 90, STREET, 0.16));
  const willets = nodeById(world, "willets");
  const dink = nodeById(world, "dinkins");
  if (willets && dink) {
    scene.add(strip(willets.x, willets.z, dink.x, dink.z, 11, "#c4b49a", 0.05));
  }
  scene.add(streetSign("United Nations Avenue North", 0, 152, 0));
  scene.add(streetSign("Avenue of the Americas", 198, 16, Math.PI / 2));
  scene.add(streetSign("Meridian Road", 82, -150, 0));
  scene.add(streetSign("New York Avenue", 36, -72, Math.PI / 2));
  scene.add(streetSign("David Dinkins Circle", -196, -8, 0));
  scene.add(streetSign("Boardwalk", -170, -28, 0));
  scene.add(streetSign("To Mets–Willets Point  ·  7 / LIRR", -220, 8, Math.PI / 2));
  scene.add(wayTotem(["Champion's Entry", "Unisphere"], 18, 188));
  scene.add(wayTotem(["Main Entry", "Lot B"], 220, 28));
  scene.add(wayTotem(["President's Entry", "Lot A · Practice 1–5"], 24, -136));

  for (const p of world.paths) {
    const a = nodeById(world, p.from);
    const b = nodeById(world, p.to);
    if (!a || !b) continue;
    const ca = pushOffFootprints(world, a.x, a.z);
    const cb = pushOffFootprints(world, b.x, b.z);
    if (Math.hypot(cb.x - ca.x, cb.z - ca.z) < 8) continue;
    scene.add(strip(ca.x, ca.z, cb.x, cb.z, 8.2, WALK, 0.07));
  }

  const trees: [number, number, number?][] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 - Math.PI / 14;
    trees.push([Math.cos(a) * 86, Math.sin(a) * 86, 0.68]);
  }
  for (let i = -2; i <= 2; i++) {
    trees.push([56 + i * 19, 52, 0.58]);
    trees.push([20 + i * 19, 118, 0.62]);
    trees.push([-8 + i * 14, 158, 0.7]);
    trees.push([-168, -18 + i * 16, 0.64]);
    trees.push([188, -6 + i * 14, 0.64]);
    trees.push([24 + i * 16, -148, 0.6]);
  }
  trees.push(
    [-72, 72, 0.66], [72, 72, 0.66], [-72, -72, 0.66], [48, -62, 0.6],
    [118, -48, 0.6], [-124, 88, 0.66], [148, 68, 0.62], [0, 148, 0.7],
    [-40, 100, 0.7], [40, 100, 0.68], [110, 20, 0.62], [-110, 30, 0.64],
    [70, -90, 0.58], [-90, -80, 0.6], [150, -20, 0.66], [-150, 50, 0.63],
  );
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    trees.push([Math.cos(a) * 210, Math.sin(a) * 210, 0.9]);
  }
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    trees.push([Math.cos(a) * 128, Math.sin(a) * 128, 0.72]);
  }
  trees.push(
    [120, 110, 0.8], [136, 98, 0.74], [-100, 80, 0.7], [-88, 96, 0.76],
    [160, -40, 0.68], [40, 130, 0.7], [-40, 130, 0.7], [200, 60, 0.82],
  );
  for (let i = 0; i < 16; i++) {
    trees.push([-70 + (i % 8) * 11, 210 + Math.floor(i / 8) * 12, 0.78]);
    trees.push([200 + (i % 4) * 10, -30 + Math.floor(i / 4) * 12, 0.74]);
    trees.push([-200 + (i % 5) * 9, 20 + Math.floor(i / 5) * 11, 0.8]);
    trees.push([-36 + (i % 6) * 14, 72 + Math.floor(i / 6) * 18, 1.15]);
  }
  const planted: [number, number, number?][] = [];
  for (const t of trees) {
    const c = pushOffFootprints(world, t[0], t[1]);
    planted.push([c.x, c.z, t[2]]);
  }
  plantTrees(scene, planted);

  const lamps: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    lamps.push([Math.cos(a) * 52, Math.sin(a) * 52]);
  }
  lamps.push([0, 140], [-90, 8], [90, -8], [56, 50], [94, 50]);
  const lampHeads = plantLamps(scene, lamps);

  const flags: [number, number][] = [];
  for (let i = -4; i <= 4; i++) flags.push([i * 16, 168]);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    flags.push([Math.cos(a) * 72, Math.sin(a) * 72]);
  }
  flags.push([18, 198], [220, 18], [8, -178]);
  const tickFlags = plantFlags(scene, flags);

  scene.add(bench(18, 78, 0.2));
  scene.add(bench(-22, 76, -0.3));
  scene.add(bench(28, 48, 1.1));
  scene.add(bench(-32, 40, -1.2));
  scene.add(bench(78, -18, 0.4));
  scene.add(bench(104, -8, -0.6));
  scene.add(bench(12, 188, 0));
  scene.add(bench(-14, 186, 0.15));
  scene.add(bench(22, 96, 0.4));
  scene.add(bench(-26, 94, -0.3));
  scene.add(bench(8, 112, 0.1));

  const potMat = mat("#6a5340", 0.8);
  const potLeaf = mat("#22822c", 0.9);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const px = Math.cos(a) * 12;
    const pz = 58 + Math.sin(a) * 12;
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.7, 8), potMat);
    pot.position.set(px, 0.38, pz);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), potLeaf);
    leaf.position.set(px, 1.05, pz);
    leaf.castShadow = true;
    scene.add(pot, leaf);
  }

  const hedgeMat = mat("#1c6a24", 0.9);
  for (const [x, z, w, rot] of [
    [48, 68, 22, 0], [-48, 68, 18, 0.15], [118, 8, 16, 1.2], [-70, 8, 14, -1.1],
  ] as const) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(w, 1.15, 0.7), hedgeMat);
    h.position.set(x, 0.6, z);
    h.rotation.y = rot;
    h.castShadow = true;
    h.receiveShadow = true;
    scene.add(h);
  }

  const lake = disk(20, "#4e9bb4", 0.04);
  lake.position.set(36, 0.04, 268);
  scene.add(lake);
  return { lampHeads, tickFlags };
}

export function highlightPath(ids: string[], world: SiteWorld): THREE.Group {
  const g = new THREE.Group();
  const mark = (x: number, z: number, y: number) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 12, 10),
      new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.28, metalness: 0.08 }),
    );
    m.position.set(x, y, z);
    g.add(m);
  };
  for (let i = 0; i < ids.length - 1; i++) {
    const a = nodeById(world, ids[i]);
    const b = nodeById(world, ids[i + 1]);
    if (!a || !b) continue;
    const ca = pushOffFootprints(world, a.x, a.z);
    const cb = pushOffFootprints(world, b.x, b.z);
    if (Math.hypot(cb.x - ca.x, cb.z - ca.z) < 6) continue;
    g.add(strip(ca.x, ca.z, cb.x, cb.z, 2.5, ROUTE, 0.22));
  }
  const start = nodeById(world, ids[0]);
  const end = nodeById(world, ids[ids.length - 1]);
  if (start) {
    const c = pushOffFootprints(world, start.x, start.z);
    mark(c.x, c.z, 0.7);
  }
  if (end && end !== start) {
    const c = pushOffFootprints(world, end.x, end.z);
    mark(c.x, c.z, 0.7);
  }
  return g;
}
