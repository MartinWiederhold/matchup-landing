import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/// Three.js tennis-ball backdrop — verbatim port of the recipe from
/// courtswiss.netlify.app/app/ (~/Downloads/swisscourt/public/app/index.html
/// lines 380-510). One ball on mobile, two balls (left + right) on desktop.
/// Procedural felt bump map + two Catmull-Rom seam tubes per ball.
export default function TennisBalls3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const wrap = canvas.parentElement;

    // Use Three.js r152+ default colour management (sRGB output). The
    // earlier "legacy r128" toggle actually made the ball darker because
    // it skipped gamma correction on the way to the sRGB framebuffer.

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

    // Brighter studio lighting — pure white background needs stronger
    // ambient + key so the felt reads as vivid neon yellow.
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(-2, 4, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.55);
    fill.position.set(3, 0, -3);
    scene.add(fill);

    // Procedural felt bump map (128x128 luminance noise)
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
      // emissive + emissiveIntensity gives the ball self-illumination so
      // it stays vivid against any background instead of relying on
      // the directional lights alone.
      const mat = new THREE.MeshStandardMaterial({
        color: 0xe6ff20,
        emissive: 0xc7e000,
        emissiveIntensity: 0.45,
        roughness: 0.55,
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

    // Smaller balls (was 0.42) and pushed further out so each one is
    // partially clipped by the page edge — the courtswiss "peek-in" feel.
    const r = 0.34;
    const balls = [];

    if (isMobile) {
      const mobileR = r * 0.8;
      const ballM = makeBall(mobileR);
      const vFov = (camera.fov * Math.PI) / 180;
      const visH = 2 * Math.tan(vFov / 2) * camera.position.z;
      const visW = visH * camera.aspect;
      const mx = visW * 0.36;
      const myBase = visH * 0.4;
      ballM.position.set(mx, myBase, 0);
      scene.add(ballM);
      balls.push({ obj: ballM, base: myBase, kind: 'm' });
    } else {
      const ballL = makeBall(r);
      ballL.position.set(-3.7, 0.5, 0);
      scene.add(ballL);
      balls.push({ obj: ballL, base: 0.5, kind: 'l' });

      const ballR = makeBall(r);
      ballR.position.set(3.7, -0.4, 0);
      scene.add(ballR);
      balls.push({ obj: ballR, base: -0.4, kind: 'r' });
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
