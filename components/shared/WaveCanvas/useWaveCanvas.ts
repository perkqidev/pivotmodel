'use client';
import { useEffect, RefObject } from 'react';
import * as THREE from 'three';

interface Options {
  /** dark theme tunes fog colour + point colour range to remain visible on dark base */
  theme: 'light' | 'dark';
}

const THEMES = {
  light: { fog: 0xf7f7f5, lo: [0.15, 0.25, 0.37] as const, hi: [0.67, 0.76, 0.85] as const },
  dark:  { fog: 0x0e0f14, lo: [0.32, 0.45, 0.62] as const, hi: [0.78, 0.88, 0.96] as const },
};

/** Three.js particle-wave terrain. Mounts onto a <canvas> inside the host
 *  (the hero section) and sizes itself to the host. Cleans up on unmount and
 *  recreates the renderer when the theme changes. */
export function useWaveCanvas(
  canvasRef: RefObject<HTMLCanvasElement>,
  hostRef: RefObject<HTMLElement>,
  { theme }: Options
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const themeCfg = THEMES[theme];

    const COLS = 120;
    const ROWS = 78;
    const SP = 0.5;

    let renderer: THREE.WebGLRenderer | null = null;
    let raf = 0;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      return;
    }
    const r = renderer;

    let W = host.clientWidth;
    let H = host.clientHeight;
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.setSize(W, H, false);
    r.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(themeCfg.fog, 6.5, 20);

    const camera = new THREE.PerspectiveCamera(54, W / H, 0.1, 60);
    camera.position.set(0, 3.5, 7.6);

    const n = COLS * ROWS;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const base: number[] = [];
    let i = 0;
    for (let zi = 0; zi < ROWS; zi++) {
      for (let xi = 0; xi < COLS; xi++) {
        const x = (xi - (COLS - 1) / 2) * SP;
        const z = -zi * SP;
        pos[i * 3] = x;
        pos[i * 3 + 1] = 0;
        pos[i * 3 + 2] = z;
        col[i * 3] = 0.3; col[i * 3 + 1] = 0.43; col[i * 3 + 2] = 0.56;
        base.push(x, z);
        i++;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const arr = (geo.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const carr = (geo.attributes.color as THREE.BufferAttribute).array as Float32Array;

    const mat = new THREE.PointsMaterial({
      size: 0.05,
      transparent: true,
      opacity: 0.96,
      sizeAttenuation: true,
      fog: true,
      vertexColors: true,
    });
    scene.add(new THREE.Points(geo, mat));

    let mx = 0, my = 0, tmx = 0, tmy = 0;
    const onPointer = (e: PointerEvent) => {
      tmx = (e.clientX / window.innerWidth - 0.5) * 2;
      tmy = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!matchMedia('(hover: none)').matches) {
      window.addEventListener('pointermove', onPointer);
    }

    const onResize = () => {
      W = host.clientWidth;
      H = host.clientHeight;
      r.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    const lo = themeCfg.lo;
    const hi = themeCfg.hi;
    const t0 = performance.now();
    const cnt = base.length / 2;

    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      mx += (tmx - mx) * 0.04;
      my += (tmy - my) * 0.04;
      const mwx = mx * 9;
      const mwz = -5 + my * -3;
      for (let k = 0; k < cnt; k++) {
        const x = base[k * 2];
        const z = base[k * 2 + 1];
        let y =
          Math.sin(x * 0.34 + t * 0.95) * 0.4 +
          Math.cos(z * 0.3 - t * 0.8) * 0.4 +
          Math.sin((x + z) * 0.2 + t * 0.5) * 0.28 +
          Math.sin(x * 0.8 - z * 0.5 + t * 1.35) * 0.12;
        const dx = x - mwx;
        const dz = z - mwz;
        const d = Math.sqrt(dx * dx + dz * dz);
        y += Math.exp(-d * 0.42) * Math.sin(d * 2 - t * 3) * 0.55;
        arr[k * 3 + 1] = y;
        const tn = Math.max(0, Math.min(1, (y + 0.9) / 1.8));
        carr[k * 3]     = lo[0] + (hi[0] - lo[0]) * tn;
        carr[k * 3 + 1] = lo[1] + (hi[1] - lo[1]) * tn;
        carr[k * 3 + 2] = lo[2] + (hi[2] - lo[2]) * tn;
      }
      (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
      camera.position.x += (mx * 1.3 - camera.position.x) * 0.04;
      camera.position.y = 3.5 + Math.sin(t * 0.18) * 0.28;
      camera.lookAt(0, -0.5, -6);
      r.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    canvas.dataset.shown = 'true';

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', onResize);
      geo.dispose();
      mat.dispose();
      r.dispose();
    };
  }, [canvasRef, hostRef, theme]);
}
