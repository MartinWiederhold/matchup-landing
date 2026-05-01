import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/// Three.js tennis-ball backdrop, ported from courtswiss.netlify.app.
/// Mounts a transparent canvas and floats one ball on mobile / two
/// balls (left + right) on desktop. The balls have a procedural
/// felt bump map and two seam tubes per ball.
export default function TennisBalls3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const wrap = canvas.parentElement;

    let frame = 0;
    let stopped = false;

    const isMobile = window.innerWidth < 768;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      wrap.clientWidth / wrap.clientHeight,
      0.1,
      100,
    );
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);

    // Warm studio lighting — verbatim from courtswiss.netlify.app/app/.
    scene.add(new THREE.AmbientLight(0xfff8e7, 0.7));
    const key = new THREE.DirectionalLight(0xfffaf0, 1.0);
    key.position.set(-2, 4, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xfff0d4, 0.35);
    fill.position.set(3, 0, -3);
    scene.add(fill);

    // Procedural felt bump
    const bumpSize = 128;
    const bumpData = new Uint8Array(bumpSize * bumpSize);
    for (let i = 0; i < bumpData.length; i++) {
      bumpData[i] = Math.random() * 35 + 220;
    }
    const bumpTex = new THREE.DataTexture(
      bumpData,
      bumpSize,
      bumpSize,
      THREE.LuminanceFormat,
    );
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(10, 10);
    bumpTex.needsUpdate = true;

    function makeSeamCurve(radius, amplitude, offset) {
      const pts = [];
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        const lon = t;
        const lat = amplitude * Math.sin(2 * t + offset);
        const R = radius * 1.008;
        const x = R * Math.cos(lat) * Math.cos(lon);
        const y = R * Math.sin(lat);
        const z = R * Math.cos(lat) * Math.sin(lon);
        pts.push(new THREE.Vector3(x, y, z));
      }
      return new THREE.CatmullRomCurve3(pts, true);
    }

    function makeBall(radius) {
      const group = new THREE.Group();
      const geo = new THREE.SphereGeometry(radius, 64, 64);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xc6d631,
        roughness: 0.95,
        metalness: 0.0,
        bumpMap: bumpTex,
        bumpScale: 0.01 * radius,
      });
      group.add(new THREE.Mesh(geo, mat));

      const seamMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0.0,
      });
      const thick = radius * 0.02;
      const amp = 0.75;
      const gap = 0.04;
      for (let s = -1; s <= 1; s += 2) {
        const curve = makeSeamCurve(radius, amp, s * gap);
        const tubeGeo = new THREE.TubeGeometry(curve, 160, thick, 6, true);
        group.add(new THREE.Mesh(tubeGeo, seamMat));
      }
      return group;
    }

    const r = 0.42;
    const balls = [];

    if (isMobile) {
      const mobileR = r * 0.7;
      const ballM = makeBall(mobileR);
      const vFov = (camera.fov * Math.PI) / 180;
      const visH = 2 * Math.tan(vFov / 2) * camera.position.z;
      const visW = visH * camera.aspect;
      const mx = visW * 0.32;
      const myBase = visH * 0.42;
      ballM.position.set(mx, myBase, 0);
      scene.add(ballM);
      balls.push({ obj: ballM, base: myBase, kind: 'm' });
    } else {
      // Single ball on the left of the hero. The right-side ball was
      // dropped because it overlapped the mockup column on desktop.
      const ballL = makeBall(r);
      ballL.position.set(-3.2, 0.5, 0);
      scene.add(ballL);
      balls.push({ obj: ballL, base: 0.5, kind: 'l' });
    }

    function tick() {
      if (stopped) return;
      const t = Date.now() * 0.0005;
      for (const b of balls) {
        if (b.kind === 'm') {
          b.obj.rotation.y = t * 1.8;
          b.obj.rotation.x = Math.sin(t * 1.2) * 0.2;
          b.obj.position.y = b.base + Math.sin(t * 2.0) * 0.05;
        } else if (b.kind === 'l') {
          b.obj.rotation.y = t * 1.5;
          b.obj.rotation.x = Math.sin(t * 1.0) * 0.18;
          b.obj.position.y = b.base + Math.sin(t * 1.8) * 0.08;
        } else {
          b.obj.rotation.y = t * 2.2;
          b.obj.rotation.z = Math.sin(t * 1.4) * 0.2;
          b.obj.position.y = b.base + Math.sin(t * 2.4) * 0.07;
        }
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    }
    tick();

    function onResize() {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      bumpTex.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
