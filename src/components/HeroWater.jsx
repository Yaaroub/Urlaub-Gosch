"use client";

import { useEffect, useRef } from "react";

/**
 * Makes the sea in the hero photo move: the real photo pixels of the water
 * area are gently displaced on the GPU (WebGL), waves roll towards the beach
 * and the surf line surges in and out. Everything outside the water stays
 * untouched, because the canvas is transparent there and the normal <img>
 * shows through.
 *
 * - Only from tablet width on, never with "reduce motion".
 * - Uses the already loaded hero <img> as texture (no extra download).
 * - Pauses while the hero is off-screen; if WebGL is missing nothing happens.
 * - The water polygon is tuned to /hero/hero.jpeg (1536 × 1024).
 */

const VERTEX = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;
uniform sampler2D u_img;
uniform vec2 u_res;   // canvas size in device px
uniform vec2 u_off;   // image offset inside the canvas (object-fit: cover)
uniform vec2 u_size;  // drawn image size in device px
uniform float u_t;

const float HORIZON = 0.5615;

// Shoreline (image v) depending on image u, measured on hero.jpeg.
float shore(float u) {
  if (u < 0.195) return mix(0.800, 0.742, u / 0.195);
  if (u < 0.390) return mix(0.742, 0.684, (u - 0.195) / 0.195);
  if (u < 0.586) return mix(0.684, 0.635, (u - 0.390) / 0.196);
  if (u < 0.715) return mix(0.635, 0.602, (u - 0.586) / 0.129);
  return mix(0.602, 0.578, clamp((u - 0.715) / 0.047, 0.0, 1.0));
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  vec2 uv = (p - u_off) / u_size;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { gl_FragColor = vec4(0.0); return; }

  float s = shore(uv.x);
  float mask = smoothstep(HORIZON + 0.003, HORIZON + 0.02, uv.y)
             * (1.0 - smoothstep(s - 0.004, s + 0.014, uv.y))
             * (1.0 - smoothstep(0.735, 0.765, uv.x));
  if (mask < 0.002) { gl_FragColor = vec4(0.0); return; }

  // Perspective: distance from the horizon -> how close the water is.
  float d = max(uv.y - HORIZON, 0.003);
  float depth = clamp(d / 0.24, 0.0, 1.0);
  float z = 1.0 / d;

  // Swell rolling towards the beach (constant phase moves to smaller z).
  float phase = z * 6.0 + u_t * 1.4 + 0.8 * sin(uv.x * 14.0 + u_t * 0.35);
  float chop = sin(z * 15.0 - u_t * 2.3 + uv.x * 70.0) * 0.35;
  vec2 off = vec2(
    (cos(phase * 1.3 + uv.x * 38.0) * 0.55 + chop) * 0.0010,
    (sin(phase) + chop) * 0.0020
  ) * (0.15 + depth);

  // Surf line surges up the beach and back.
  float nearShore = smoothstep(s - 0.06, s - 0.005, uv.y);
  off.y += nearShore * (sin(u_t * 0.75 + uv.x * 5.0) * 0.0040 + sin(u_t * 1.9 + uv.x * 23.0) * 0.0012);

  vec3 c = texture2D(u_img, uv + off).rgb;
  // Moving light on the crests.
  c *= 1.0 + 0.045 * sin(phase - 0.6) * depth;

  gl_FragColor = vec4(c * mask, mask);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const parsePercent = (value, fallback) => {
  const n = parseFloat(value);
  return Number.isFinite(n) && String(value).trim().endsWith("%") ? n / 100 : fallback;
};

export default function HeroWater() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    if (!window.matchMedia("(min-width: 768px)").matches) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const img = canvas.parentElement?.querySelector("img");
    if (!img) return undefined;

    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return undefined;

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return undefined;
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name) => gl.getUniformLocation(program, name);
    const uRes = u("u_res");
    const uOff = u("u_off");
    const uSize = u("u_size");
    const uT = u("u_t");

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    let textureReady = false;
    let loadedSrc = "";
    const uploadTexture = () => {
      if (!img.complete || !img.naturalWidth) return;
      if (textureReady && loadedSrc === img.currentSrc) return;
      try {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        textureReady = true;
        loadedSrc = img.currentSrc;
      } catch {
        textureReady = false;
      }
    };

    let width = 0;
    let height = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (!rect.width) return;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    };

    const layout = () => {
      // Same placement as the <img> (object-fit: cover + object-position).
      const iw = img.naturalWidth || 1536;
      const ih = img.naturalHeight || 1024;
      const scale = Math.max(width / iw, height / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const [px, py] = getComputedStyle(img).objectPosition.split(" ");
      return { dw, dh, ox: (width - dw) * parsePercent(px, 0.5), oy: (height - dh) * parsePercent(py, 0.5) };
    };

    let visible = true;
    let frame = 0;
    let shown = false;
    const start = performance.now();

    const render = (now) => {
      frame = 0;
      if (!visible) return;
      uploadTexture();
      if (textureReady && width > 1) {
        const { dw, dh, ox, oy } = layout();
        gl.uniform2f(uRes, width, height);
        gl.uniform2f(uOff, ox, oy);
        gl.uniform2f(uSize, dw, dh);
        gl.uniform1f(uT, (now - start) / 1000);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        if (!shown) {
          shown = true;
          canvas.style.opacity = "1";
        }
      }
      frame = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) frame = requestAnimationFrame(render);
    });
    intersection.observe(canvas);

    img.addEventListener("load", uploadTexture);
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      img.removeEventListener("load", uploadTexture);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden h-full w-full opacity-0 transition-opacity duration-700 md:block"
    />
  );
}
