/**
 * Gelände nach der US-Open-Grounds-Map: helles Gras, weiße Plaza,
 * Hexagon um Ashe, Instanced-Bäume und -Lampen. Wege sind Plaza, kein Asphalt.
 */

import * as THREE from "three";
import type { SiteWorld } from "@/domain/tour/siteWorld";
import { nodeById } from "@/domain/tour/siteWorld";

const GRASS = "#46ad3e";
const GRASS_DARK = "#359635";
const PLAZA = "#f4f2eb";
const WALK = "#efece4";
const STREET = "#d8d6d0";
const ROUTE = "#2b6bff";
const SKY = "#dce8d6";

function mat(color: string, roughness = 0.88): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

export function disk(r: number, color: string, y = 0.02): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 72), mat(color, 0.94));
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
  const m = new THREE.Mesh(geo, mat(PLAZA, 0.84));
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
  const crownGeo = new THREE.SphereGeometry(1.85, 8, 6);
  const crownMat = mat("#22822c", 0.92);
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.24, 1.6, 6);
  const trunkMat = mat("#6a5340", 0.88);
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, spots.length);
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, spots.length);
  crowns.castShadow = true;
  const dummy = new THREE.Object3D();
  spots.forEach(([x, z, s], i) => {
    const sc = s ?? 1;
    dummy.position.set(x, 0.8 * sc, z);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, 2.05 * sc, z);
    dummy.updateMatrix();
    crowns.setMatrixAt(i, dummy.matrix);
  });
  scene.add(trunks, crowns);
}

function plantLamps(scene: THREE.Scene, spots: [number, number][]): void {
  const pole = new THREE.CylinderGeometry(0.09, 0.12, 4.2, 6);
  const head = new THREE.SphereGeometry(0.28, 8, 6);
  const poles = new THREE.InstancedMesh(pole, mat("#c8c4ba", 0.45), spots.length);
  const heads = new THREE.InstancedMesh(head, mat("#fff6d8", 0.35), spots.length);
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
}

function plantCrowd(scene: THREE.Scene, spots: [number, number][]): void {
  const body = new THREE.CapsuleGeometry(0.28, 0.7, 3, 6);
  const shirts = new THREE.InstancedMesh(body, mat("#d8d4cc", 0.7), spots.length);
  const dummy = new THREE.Object3D();
  spots.forEach(([x, z], i) => {
    dummy.position.set(x, 0.85, z);
    dummy.rotation.y = (i * 1.7) % Math.PI;
    dummy.updateMatrix();
    shirts.setMatrixAt(i, dummy.matrix);
  });
  scene.add(shirts);
}

export function buildCampus(scene: THREE.Scene, world: SiteWorld): void {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1600, 28, 16),
    new THREE.MeshBasicMaterial({ color: SKY, side: THREE.BackSide }),
  );
  scene.add(sky);

  scene.add(disk(340, GRASS_DARK, 0));
  scene.add(disk(280, GRASS, 0.012));
  scene.add(hexPad(80, 0.04));
  scene.add(hexPad(46, 0.055));

  const plazaAt: Record<string, [number, number]> = {
    "food-village": [50, 38],
    armstrong: [68, 50],
    grandstand: [54, 46],
    court17: [50, 42],
    practice: [78, 36],
  };
  for (const [id, [w, d]] of Object.entries(plazaAt)) {
    const n = nodeById(world, id);
    if (n) scene.add(pad(n.x, n.z, w, d, PLAZA, 0.035));
  }

  const gate = nodeById(world, "south-gate");
  if (gate) scene.add(pad(gate.x, gate.z - 18, 230, 22, STREET, 0.03));
  const arm = nodeById(world, "armstrong");
  if (arm) scene.add(pad(arm.x, arm.z - 28, 96, 14, STREET, 0.03));
  const main = nodeById(world, "east-gate");
  if (main) scene.add(pad(main.x + 8, main.z, 16, 90, STREET, 0.03));
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
  scene.add(wayTotem(["President's Entry", "Lot A · Practice 1–5"], 8, -168));

  for (const p of world.paths) {
    const a = nodeById(world, p.from);
    const b = nodeById(world, p.to);
    if (!a || !b) continue;
    scene.add(strip(a.x, a.z, b.x, b.z, 8.2, WALK, 0.07));
  }

  const trees: [number, number, number?][] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 - Math.PI / 14;
    trees.push([Math.cos(a) * 86, Math.sin(a) * 86, 0.68]);
  }
  for (let i = -2; i <= 2; i++) {
    trees.push([56 + i * 19, 52, 0.58]);
    trees.push([20 + i * 19, 118, 0.62]);
    trees.push([-168, -18 + i * 16, 0.64]);
    trees.push([188, -6 + i * 14, 0.64]);
    trees.push([24 + i * 16, -148, 0.6]);
  }
  trees.push(
    [-72, 72, 0.66], [72, 72, 0.66], [-72, -72, 0.66], [48, -62, 0.6],
    [118, -48, 0.6], [-124, 88, 0.66], [148, 68, 0.62], [0, 148, 0.7],
  );
  plantTrees(scene, trees);

  const lamps: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    lamps.push([Math.cos(a) * 52, Math.sin(a) * 52]);
  }
  lamps.push([0, 140], [-90, 8], [90, -8], [56, 50], [94, 50]);
  plantLamps(scene, lamps);

  const crowd: [number, number][] = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + 0.2;
    crowd.push([Math.cos(a) * 48 + (i % 3) * 1.4, Math.sin(a) * 48]);
  }
  plantCrowd(scene, crowd);

  const lake = disk(20, "#4e9bb4", 0.04);
  lake.position.set(36, 0.04, 268);
  scene.add(lake);
}

export function highlightPath(ids: string[], world: SiteWorld): THREE.Group {
  const g = new THREE.Group();
  const mark = (x: number, z: number, y: number) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 16, 12),
      new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.28, metalness: 0.08 }),
    );
    m.position.set(x, y, z);
    g.add(m);
  };
  for (let i = 0; i < ids.length - 1; i++) {
    const a = nodeById(world, ids[i]);
    const b = nodeById(world, ids[i + 1]);
    if (!a || !b) continue;
    g.add(strip(a.x, a.z, b.x, b.z, 2.5, ROUTE, 0.22));
  }
  const start = nodeById(world, ids[0]);
  const end = nodeById(world, ids[ids.length - 1]);
  if (start) mark(start.x, start.z, 0.7);
  if (end && end !== start) mark(end.x, end.z, 0.7);
  return g;
}
