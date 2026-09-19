/**
 * Erkennbare Bauten — stilisiert, pickbar. Ashe mit Sitzringen + Dachbögen
 * (öffentliche Tatsache: retractable roof), keine erfundenen Innenräume.
 */

import * as THREE from "three";

function mat(color: string, extra: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });
}

function tennisCourt(w: number, d: number): THREE.Group {
  const g = new THREE.Group();
  const blue = new THREE.Mesh(new THREE.BoxGeometry(w, 0.28, d), mat("#2a4a92", { roughness: 0.48 }));
  blue.position.y = 0.16;
  blue.receiveShadow = true;
  g.add(blue);
  const line = mat("#e8d9a0", { roughness: 0.35 });
  const bar = (ww: number, dd: number, x: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(ww, 0.3, dd), line);
    m.position.set(x, 0.18, z);
    g.add(m);
  };
  bar(0.28, d * 0.92, 0, 0);
  bar(w * 0.72, 0.28, 0, 0);
  bar(w * 0.72, 0.28, 0, d * 0.18);
  bar(w * 0.72, 0.28, 0, -d * 0.18);
  bar(0.22, d * 0.36, w * 0.22, 0);
  bar(0.22, d * 0.36, -w * 0.22, 0);
  return g;
}

/** Rundes Stadion: Court innen, massiver Kessel — lesbar auch aus der Übersicht. */
export function stadium(id: string, r: number, tiers: number, wall: string, seat = "#3a5fa8"): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = id;
  const court = tennisCourt(Math.min(r * 0.55, 16), Math.min(r * 0.95, 32));
  court.position.y = 0.02;
  g.add(court);
  const bowlH = Math.max(10, r * 0.42);
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 1.18, r * 1.28, bowlH, 48, 1, true),
    mat(wall, { side: THREE.DoubleSide, roughness: 0.68 }),
  );
  shell.position.y = bowlH / 2;
  shell.castShadow = true;
  g.add(shell);
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(r * 1.2, 1.4, 8, 48),
    mat("#d8d2c6", { roughness: 0.4 }),
  );
  lip.rotation.x = Math.PI / 2;
  lip.position.y = bowlH;
  g.add(lip);
  for (let i = 0; i < tiers; i++) {
    const t = (i + 1) / (tiers + 0.4);
    const seatR = r * (0.58 + t * 0.5);
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(seatR, r * 0.055, 6, 48),
      mat(i % 2 ? seat : "#2e4e8c", { roughness: 0.55 }),
    );
    band.rotation.x = Math.PI / 2;
    band.position.y = 1.2 + i * (bowlH / (tiers + 0.6));
    g.add(band);
  }
  return g;
}

export function asheStadium(): THREE.Group {
  const g = stadium("ashe", 28, 4, "#3b4048");
  const archMat = mat("#e8e4dc", { metalness: 0.38, roughness: 0.28 });
  for (const yaw of [0, Math.PI / 2]) {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(34, 1.6, 8, 40, Math.PI), archMat);
    arch.rotation.z = Math.PI / 2;
    arch.rotation.y = yaw;
    arch.position.y = 18;
    g.add(arch);
  }
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(33.5, 1.5, 8, 48),
    mat("#d9d4c8", { metalness: 0.28, roughness: 0.35 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 16;
  return g;
}

export function grandstandHouse(): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = "grandstand";
  const court = tennisCourt(14, 28);
  g.add(court);
  for (let i = 0; i < 5; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(32, 1.4, 3.2), mat(i % 2 ? "#4e535c" : "#3d424a"));
    step.position.set(0, 0.8 + i * 1.35, -16 - i * 1.1);
    step.castShadow = true;
    g.add(step);
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(34, 0.5, 10), mat("#d8d2c6", { roughness: 0.4 }));
  roof.position.set(0, 8.2, -20);
  g.add(roof);
  return g;
}

export function pavilion(id: string, w: number, d: number, h: number, color: string): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = id;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, { roughness: 0.62 }));
  body.position.y = h / 2;
  body.castShadow = true;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 2.4, 0.45, d + 2.4), mat("#f2eee6", { roughness: 0.4 }));
  roof.position.y = h + 0.4;
  const posts = [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]] as const;
  for (const [px, pz] of posts) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, h + 0.6, 6), mat("#8a8074"));
    p.position.set(px, (h + 0.6) / 2, pz);
    g.add(p);
  }
  g.add(body, roof);
  return g;
}

export function gateHouse(): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = "south-gate";
  for (const x of [-5.5, 5.5]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(2.2, 8, 2.2), mat("#f3f0ea"));
    p.position.set(x, 4, 0);
    p.castShadow = true;
    g.add(p);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(14, 1.1, 2.4), mat("#2a2a2c"));
  beam.position.y = 8.2;
  g.add(beam);
  return g;
}

export function stationHouse(): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = "willets";
  const hall = new THREE.Mesh(new THREE.BoxGeometry(18, 7, 10), mat("#c5ccd2"));
  hall.position.y = 3.5;
  hall.castShadow = true;
  const plat = new THREE.Mesh(new THREE.BoxGeometry(28, 0.6, 6), mat("#8b8680"));
  plat.position.set(0, 0.4, 8);
  g.add(hall, plat);
  return g;
}

export function unisphere(): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = "unisphere";
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(9, 32, 24),
    mat("#c5d0d6", { metalness: 0.62, roughness: 0.22 }),
  );
  ball.position.y = 10;
  ball.castShadow = true;
  const mer = new THREE.Mesh(
    new THREE.SphereGeometry(9.12, 24, 16),
    new THREE.MeshBasicMaterial({ color: "#8fa0aa", wireframe: true, transparent: true, opacity: 0.45 }),
  );
  mer.position.y = 10;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.2, 2.2, 12), mat("#9aa0a6"));
  base.position.y = 1.1;
  g.add(ball, mer, base);
  return g;
}

export function markedCourt(id: string, w: number, d: number): THREE.Group {
  const g = tennisCourt(w, d);
  g.userData.nodeId = id;
  return g;
}

/** Food Village — Stände, keine Markennamen. */
export function foodHall(): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = "food-village";
  const hall = new THREE.Mesh(new THREE.BoxGeometry(22, 5.2, 14), mat("#efe6d6", { roughness: 0.62 }));
  hall.position.y = 2.6;
  hall.castShadow = true;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(24, 0.4, 16), mat("#c43b3b", { roughness: 0.5 }));
  roof.position.y = 5.5;
  g.add(hall, roof);
  for (let i = 0; i < 3; i++) {
    const stall = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 4), mat("#e8d7c4"));
    stall.position.set(-8 + i * 8, 1.5, 10);
    stall.castShadow = true;
    g.add(stall);
  }
  return g;
}

/** South Plaza — Brunnenplatz, stilisiert. */
export function plazaMark(): THREE.Group {
  const g = new THREE.Group();
  g.userData.nodeId = "south-plaza";
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(7.5, 0.55, 8, 32),
    mat("#c9c2b4", { roughness: 0.45 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.4;
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(6.2, 28),
    mat("#3d6f86", { roughness: 0.25, metalness: 0.15 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.18;
  g.add(ring, water);
  return g;
}
