"use client";

/**
 * Eine autorisierte Turnier-Welt in Three.js — kein Satellit, kein CAD-Claim.
 * Knoten und Wege kommen aus der Welt-Datei; die Meshes sind Spiel-Geometrie.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { SiteNode, SiteWorld } from "@/domain/tour/siteWorld";
import { isAmenityKind, nodeById, nodeHasFlag, pathBetween, SERVICE_KINDS } from "@/domain/tour/siteWorld";
import { weatherLook } from "@/domain/tour/siteWeather";
import { buildCampus, highlightPath } from "./buildCampus";
import {
  amenityHut,
  armstrongStadium,
  asheStadium,
  foodHall,
  gateHouse,
  grandstandHouse,
  numberedCourt,
  outerCourtNum,
  parkingLot,
  pavilion,
  pitCourt,
  plazaMark,
  practiceYard,
  rideshareCanopy,
  stationHouse,
  unisphere,
} from "./buildLandmarks";
import type { AmenityFilter } from "./AmenityBar";
import type { SiteWeatherNow } from "./loadWeather";

const LABEL_IDS = new Set([
  "ashe", "armstrong", "grandstand", "court17", "food-village",
  "east-gate", "south-gate", "president-gate", "box-office",
  "practice", "willets", "lot-a", "lot-b", "rideshare", "boardwalk",
]);
const PIN_SHORT: Record<string, string> = {
  practice: "Practice 1–5",
  willets: "7 / LIRR",
  "lot-a": "Lot A",
  "lot-b": "Lot B",
  rideshare: "Rideshare",
  boardwalk: "Boardwalk",
};
const AMENITY_SHORT: Record<string, string> = {
  restroom: "WC",
  firstaid: "+",
  water: "H2O",
  info: "i",
  access: "A",
  baggage: "BAG",
  lostfound: "LF",
  atm: "ATM",
  charger: "USB",
  boxoffice: "TIX",
};

function pinKind(n: SiteNode): string {
  if (n.id === "food-village") return "food";
  if (isAmenityKind(n.kind)) return n.kind;
  return "place";
}

function pinVisible(n: SiteNode, filter: AmenityFilter, dist: number, focus: string | null): boolean {
  const kind = pinKind(n);
  if (focus === n.id) return true;
  if (filter === "all") {
    if (LABEL_IDS.has(n.id) || outerCourtNum(n.id)) return true;
    return isAmenityKind(n.kind) && dist < 150;
  }
  if (filter === "food") return n.id === "food-village";
  if (filter === "access") {
    return kind === "access" || nodeHasFlag(n, "accessible") || nodeHasFlag(n, "wheelchairSeating");
  }
  if (filter === "restroom") return kind === "restroom";
  if (filter === "service") return SERVICE_KINDS.has(n.kind);
  return kind === filter;
}

export default function SiteWorld({
  world,
  focusId,
  onFocus,
  weather,
  filter,
}: {
  world: SiteWorld;
  focusId: string | null;
  onFocus: (id: string) => void;
  weather?: SiteWeatherNow | null;
  filter?: AmenityFilter;
}) {
  const box = useRef<HTMLDivElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const focusRef = useRef(focusId);
  const onFocusRef = useRef(onFocus);
  const weatherRef = useRef(weather ?? null);
  const filterRef = useRef(filter ?? "all");
  focusRef.current = focusId;
  onFocusRef.current = onFocus;
  weatherRef.current = weather ?? null;
  filterRef.current = filter ?? "all";

  useEffect(() => {
    const host = box.current;
    const labelHost = labels.current;
    if (!host || !labelHost) return;
    const scene = new THREE.Scene();
      scene.background = new THREE.Color("#dce8d6");
      scene.fog = new THREE.Fog("#dce8d6", 460, 880);

      const camera = new THREE.PerspectiveCamera(34, 1, 0.8, 3600);
      const introFrom = new THREE.Vector3(36, 620, 540);
      const introTo = new THREE.Vector3(4, 34, 52);
      const lookFrom = new THREE.Vector3(8, 0, -12);
      const lookTo = new THREE.Vector3(0, 5, 0);
      camera.position.copy(introFrom);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      host.appendChild(renderer.domElement);
      renderer.domElement.className = "absolute inset-0 h-full w-full";
      renderer.domElement.style.touchAction = "none";

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.minDistance = 14;
      controls.maxDistance = 1800;
      controls.minPolarAngle = 0.18;
      controls.maxPolarAngle = 1.32;
      controls.target.copy(lookFrom);
      controls.enabled = false;

      const hemi = new THREE.HemisphereLight("#f4f6f2", "#3a7e34", 0.95);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight("#fff3d6", 1.62);
      sun.position.set(120, 180, 80);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.left = -220;
      sun.shadow.camera.right = 220;
      sun.shadow.camera.top = 220;
      sun.shadow.camera.bottom = -220;
      scene.add(sun);

      buildCampus(scene, world);

      const pickables: THREE.Object3D[] = [];
      const amenityMeshes = new Map<string, THREE.Object3D>();

      const addPick = (mesh: THREE.Object3D, id: string) => {
        mesh.userData.nodeId = id;
        mesh.traverse((c) => { c.userData.nodeId = id; });
        pickables.push(mesh);
        scene.add(mesh);
      };

      const meshFor = (n: SiteNode): THREE.Group | null => {
        const outer = outerCourtNum(n.id);
        if (outer) return numberedCourt(n.id, outer);
        if (isAmenityKind(n.kind)) return amenityHut(n.id, n.kind);
        switch (n.id) {
          case "ashe": return asheStadium();
          case "armstrong": return armstrongStadium();
          case "grandstand": return grandstandHouse();
          case "court17": return pitCourt();
          case "practice": return practiceYard();
          case "stringer": return pavilion("stringer", 12, 9, 4.8, "#efe8dc");
          case "player": return pavilion("player", 16, 11, 5.4, "#e8e2d6");
          case "south-gate": return gateHouse("south-gate");
          case "east-gate": return gateHouse("east-gate");
          case "president-gate": return gateHouse("president-gate");
          case "player-entrance": return pavilion("player-entrance", 10, 6, 4.2, "#efe8dc");
          case "photo-pit": return pavilion("photo-pit", 8, 5, 2.4, "#d8d2c6");
          case "dinkins": return plazaMark();
          case "willets": return stationHouse();
          case "unisphere": return unisphere();
          case "food-village": return foodHall();
          case "south-plaza": return plazaMark();
          case "lot-a": return parkingLot("lot-a", "A");
          case "lot-b": return parkingLot("lot-b", "B");
          case "rideshare": return rideshareCanopy();
          default: return null;
        }
      };
      for (const n of world.nodes) {
        const mesh = meshFor(n);
        if (!mesh) continue;
        mesh.position.set(n.x, 0, n.z);
        addPick(mesh, n.id);
        if (isAmenityKind(n.kind)) amenityMeshes.set(n.id, mesh);
      }

      const dropGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 4);
      const drops = new THREE.InstancedMesh(
        dropGeo,
        new THREE.MeshBasicMaterial({ color: "#9ec4d8", transparent: true, opacity: 0.55 }),
        90,
      );
      drops.visible = false;
      const dropDummy = new THREE.Object3D();
      const dropSeed = world.nodes.filter((n) => n.id === "ashe" || n.id === "food-village" || n.id === "south-plaza");
      scene.add(drops);

      let route = new THREE.Group();
      scene.add(route);
      const applyPath = (ids: string[]) => {
        scene.remove(route);
        route = highlightPath(ids, world);
        scene.add(route);
      };

      let look = new THREE.Vector3(8, 0, -12);
      const flyTo = (n: SiteNode) => {
        look.set(n.x, 2, n.z);
        controls.target.set(n.x, 2, n.z);
        if (n.id === "ashe") {
          look.set(n.x, 5, n.z);
          controls.target.set(n.x, 5, n.z);
          camera.position.set(n.x + 4, 34, n.z + 52);
        } else if (n.id === "armstrong") {
          look.set(n.x, 4, n.z);
          controls.target.set(n.x, 4, n.z);
          camera.position.set(n.x + 8, 28, n.z + 38);
        } else if (n.id === "lot-a" || n.id === "lot-b" || n.id === "rideshare") {
          camera.position.set(n.x + 22, 22, n.z + 30);
        } else if (isAmenityKind(n.kind)) camera.position.set(n.x + 14, 16, n.z + 22);
        else camera.position.set(n.x + 28, 18, n.z + 36);
        applyPath(pathBetween(world, "south-gate", n.id));
      };

      const ray = new THREE.Raycaster();
      const ptr = new THREE.Vector2();
      const onClick = (ev: PointerEvent) => {
        const r = renderer.domElement.getBoundingClientRect();
        ptr.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
        ptr.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
        ray.setFromCamera(ptr, camera);
        const hit = ray.intersectObjects(pickables, true)[0];
        const id = hit?.object.userData.nodeId as string | undefined;
        if (id) onFocusRef.current(id);
      };
      renderer.domElement.addEventListener("pointerdown", onClick);

      const labelEls = new Map<string, HTMLButtonElement>();
      for (const n of world.nodes) {
        const amenity = isAmenityKind(n.kind);
        const courtNum = outerCourtNum(n.id);
        if (!LABEL_IDS.has(n.id) && !amenity && !courtNum) continue;
        const b = document.createElement("button");
        b.type = "button";
        b.className = `t2-world-pin pointer-events-auto${amenity ? ` is-amenity is-${n.kind}` : ""}${courtNum ? " is-courtnum" : ""}${nodeHasFlag(n, "accessible") ? " is-access" : ""}`;
        b.textContent = amenity
          ? (nodeHasFlag(n, "accessible") ? "ADA" : (AMENITY_SHORT[n.kind] ?? n.name))
          : (PIN_SHORT[n.id] ?? courtNum ?? n.name);
        b.addEventListener("click", () => onFocusRef.current(n.id));
        labelHost.appendChild(b);
        labelEls.set(n.id, b);
      }

      const v = new THREE.Vector3();
      const camAt = new THREE.Vector3();
      const paintLabels = () => {
        const r = host.getBoundingClientRect();
        const mode = filterRef.current;
        camera.getWorldPosition(camAt);
        for (const n of world.nodes) {
          const el = labelEls.get(n.id);
          if (!el) continue;
          const dist = camAt.distanceTo(new THREE.Vector3(n.x, 0, n.z));
          const show = pinVisible(n, mode, dist, focusRef.current);
          v.set(n.x, isAmenityKind(n.kind) ? 4.2 : outerCourtNum(n.id) ? 6.4 : 18, n.z).project(camera);
          const x = (v.x * 0.5 + 0.5) * r.width;
          const y = (-v.y * 0.5 + 0.5) * r.height;
          const vis = show && v.z < 1;
          el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
          el.style.opacity = vis ? "1" : "0";
          el.style.pointerEvents = vis ? "auto" : "none";
          el.classList.toggle("is-on", focusRef.current === n.id);
          const mesh = amenityMeshes.get(n.id);
          if (mesh) mesh.visible = mode === "all" || pinVisible(n, mode, 0, focusRef.current);
        }
      };

      const applyWeather = () => {
        const wx = weatherRef.current;
        const lookWx = weatherLook(wx?.code ?? 1);
        scene.background = new THREE.Color(lookWx.sky);
        scene.fog = new THREE.Fog(lookWx.fog, 460, 880);
        hemi.intensity = lookWx.hemi;
        sun.intensity = lookWx.sun;
        drops.visible = lookWx.rain;
        renderer.toneMappingExposure = lookWx.rain ? 0.92 : 1.12;
      };

      const resize = () => {
        const w = host.clientWidth || 1;
        const h = host.clientHeight || 1;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };
      const ro = new ResizeObserver(resize);
      ro.observe(host);
      resize();

      let lastFocus = focusRef.current ?? "ashe";
      applyPath(pathBetween(world, "south-gate", lastFocus));
      let raf = 0;
      let t0 = performance.now();
      let lastTick = t0;
      let intro = 0;
      const INTRO_S = 0.82;
      const tick = () => {
        const now = performance.now();
        const dt = Math.min(0.05, (now - lastTick) / 1000);
        lastTick = now;
        applyWeather();
        if (intro < 1) {
          intro = Math.min(1, intro + dt / INTRO_S);
          const e = 1 - (1 - intro) ** 3;
          camera.position.lerpVectors(introFrom, introTo, e);
          look.lerpVectors(lookFrom, lookTo, e);
          controls.target.copy(look);
          const fogFar = 880 + (1 - e) * 2200;
          scene.fog = new THREE.Fog((scene.fog as THREE.Fog).color, fogFar * 0.45, fogFar);
          if (intro >= 1) {
            controls.maxDistance = 640;
            controls.enabled = true;
          }
        } else {
          const want = focusRef.current ?? "ashe";
          if (want !== lastFocus) {
            lastFocus = want;
            const n = nodeById(world, want);
            if (n) flyTo(n);
          }
          controls.target.lerp(look, 0.06);
          controls.update();
        }
        if (drops.visible) {
          const t = (now - t0) * 0.001;
          dropSeed.forEach((n, i) => {
            for (let k = 0; k < 30; k++) {
              const idx = i * 30 + k;
              if (idx >= 90) return;
              const x = n.x + ((k * 17 + i * 9) % 40) - 20;
              const z = n.z + ((k * 13 + i * 5) % 36) - 18;
              const y = 18 - ((t * 14 + k * 1.7) % 18);
              dropDummy.position.set(x, y, z);
              dropDummy.updateMatrix();
              drops.setMatrixAt(idx, dropDummy.matrix);
            }
          });
          drops.instanceMatrix.needsUpdate = true;
        }
        renderer.render(scene, camera);
        paintLabels();
        raf = requestAnimationFrame(tick);
      };
      tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onClick);
      labelEls.forEach((el) => el.remove());
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [world]);

  return (
    <div className="absolute inset-0 t2-world-enter">
      <div ref={box} className="absolute inset-0" />
      <div ref={labels} className="pointer-events-none absolute inset-0 z-[5]" />
    </div>
  );
}
