"use client";

/**
 * Eine autorisierte Turnier-Welt in Three.js — kein Satellit, kein CAD-Claim.
 * Knoten und Wege kommen aus der Welt-Datei; die Meshes sind Spiel-Geometrie.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { SiteNode, SiteWorld } from "@/domain/tour/siteWorld";
import { nodeById, pathBetween } from "@/domain/tour/siteWorld";
import { buildCampus, highlightPath } from "./buildCampus";
import { asheStadium, foodHall, gateHouse, grandstandHouse, markedCourt, pavilion, plazaMark, stadium, stationHouse, unisphere } from "./buildLandmarks";

export default function SiteWorld({
  world,
  focusId,
  onFocus,
}: {
  world: SiteWorld;
  focusId: string | null;
  onFocus: (id: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const focusRef = useRef(focusId);
  const onFocusRef = useRef(onFocus);
  focusRef.current = focusId;
  onFocusRef.current = onFocus;

  useEffect(() => {
    const host = box.current;
    const labelHost = labels.current;
    if (!host || !labelHost) return;
    const scene = new THREE.Scene();
      scene.background = new THREE.Color("#9eb6c6");
      scene.fog = new THREE.Fog("#9eb6c6", 320, 700);

      const camera = new THREE.PerspectiveCamera(42, 1, 0.8, 900);
      camera.position.set(90, 170, 210);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      host.appendChild(renderer.domElement);
      renderer.domElement.className = "absolute inset-0 h-full w-full";
      renderer.domElement.style.touchAction = "none";

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.minDistance = 40;
      controls.maxDistance = 420;
      controls.minPolarAngle = 0.35;
      controls.maxPolarAngle = 1.15;
      controls.target.set(0, 2, -50);

      const hemi = new THREE.HemisphereLight("#d7e4ee", "#3f5a38", 1.05);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight("#fff4dc", 1.35);
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

      const addPick = (mesh: THREE.Object3D, id: string) => {
        mesh.userData.nodeId = id;
        mesh.traverse((c) => { c.userData.nodeId = id; });
        pickables.push(mesh);
        scene.add(mesh);
      };

      const meshFor = (id: string): THREE.Group | null => {
        switch (id) {
          case "ashe": return asheStadium();
          case "armstrong": return stadium("armstrong", 20, 3, "#4a3f38", "#c45a2a");
          case "grandstand": return grandstandHouse();
          case "court17": return stadium("court17", 16, 2, "#3a4048", "#2450a0");
          case "practice": return markedCourt("practice", 14, 28);
          case "stringer": return pavilion("stringer", 16, 12, 6, "#efe8dc");
          case "player": return pavilion("player", 20, 14, 7.5, "#d8cfc0");
          case "south-gate": return gateHouse();
          case "willets": return stationHouse();
          case "unisphere": return unisphere();
          case "food-village": return foodHall();
          case "south-plaza": return plazaMark();
          default: return null;
        }
      };
      for (const n of world.nodes) {
        const mesh = meshFor(n.id);
        if (!mesh) continue;
        mesh.position.set(n.x, 0, n.z);
        addPick(mesh, n.id);
      }

      let route = new THREE.Group();
      scene.add(route);
      const applyPath = (ids: string[]) => {
        scene.remove(route);
        route = highlightPath(ids, world);
        scene.add(route);
      };

      let look = new THREE.Vector3(0, 4, -40);
      const flyTo = (n: SiteNode) => {
        look = new THREE.Vector3(n.x, 6, n.z);
        camera.position.set(n.x + 48, 52, n.z + 78);
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
        const b = document.createElement("button");
        b.type = "button";
        b.className = "t2-world-pin pointer-events-auto";
        b.textContent = n.name;
        b.addEventListener("click", () => onFocusRef.current(n.id));
        labelHost.appendChild(b);
        labelEls.set(n.id, b);
      }

      const v = new THREE.Vector3();
      const paintLabels = () => {
        const r = host.getBoundingClientRect();
        for (const n of world.nodes) {
          const el = labelEls.get(n.id);
          if (!el) continue;
          v.set(n.x, 16, n.z).project(camera);
          const x = (v.x * 0.5 + 0.5) * r.width;
          const y = (-v.y * 0.5 + 0.5) * r.height;
          const vis = v.z < 1;
          el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
          el.style.opacity = vis ? "1" : "0";
          el.classList.toggle("is-on", focusRef.current === n.id);
        }
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
      const tick = () => {
        const want = focusRef.current ?? "ashe";
        if (want !== lastFocus) {
          lastFocus = want;
          const n = nodeById(world, want);
          if (n) flyTo(n);
        }
        controls.target.lerp(look, 0.06);
        controls.update();
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
    <div className="absolute inset-0">
      <div ref={box} className="absolute inset-0" />
      <div ref={labels} className="pointer-events-none absolute inset-0 z-[5]" />
    </div>
  );
}
