/**
 * Himmel-Gradient aus dem Wetterlook — klarer Himmel, keine Wolkenkugeln.
 */

import * as THREE from "three";
import type { SiteWeatherLook } from "@/domain/tour/siteWeather";

const skyCache = new Map<string, THREE.CanvasTexture>();

function skyMap(zenith: string, horizon: string): THREE.CanvasTexture {
  const key = `${zenith}|${horizon}`;
  const hit = skyCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 512;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, zenith);
    g.addColorStop(0.52, zenith);
    g.addColorStop(0.78, horizon);
    g.addColorStop(1, horizon);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 512);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  skyCache.set(key, tex);
  return tex;
}

/** Große Rückseite, wolkenlos. Sonne kommt aus SiteWorld. */
export function plantAtmosphere(scene: THREE.Scene): (look: SiteWeatherLook, t: number) => void {
  const skyMat = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
    map: skyMap("#6eb4f2", "#e4f0d8"),
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1680, 36, 22), skyMat));

  return (look) => {
    skyMat.map = skyMap(look.sky, look.horizon);
    skyMat.needsUpdate = true;
  };
}
