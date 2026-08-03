"use client";

import { Renderer, Program, Mesh, Triangle } from "ogl";
import { useEffect, useRef } from "react";

const MAX_STRANDS = 12;
const MAX_COLORS = 8;

/* ─── Shaders (module scope so they exist before use) ─── */

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
uniform int uStrandCount;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaviness;
uniform float uThickness;
uniform float uGlow;
uniform float uTaper;
uniform float uSpread;
uniform float uHueShift;
uniform float uIntensity;
uniform float uOpacity;
uniform float uScale;
uniform float uSaturation;

out vec4 fragColor;

const float PI = 3.14159265;

vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(2.0 * PI * (t + vec3(0.00, 0.33, 0.67)));
}

vec3 samplePalette(float t) {
  t = fract(t);
  float scaled = t * float(uColorCount);
  int idx = int(floor(scaled));
  float blend = fract(scaled);
  int nextIdx = idx + 1;
  if (nextIdx >= uColorCount) nextIdx = 0;
  return mix(uColors[idx], uColors[nextIdx], blend);
}

vec3 strandColor(float t) {
  if (uColorCount > 0) return samplePalette(t);
  return spectrum(t);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  uv /= max(uScale, 0.0001);

  float e = 0.06 + uIntensity * 0.94;
  float env = pow(max(cos(uv.x * PI * 1.3), 0.0), uTaper);
  vec3 col = vec3(0.0);

  for (int i = 0; i < ${MAX_STRANDS}; i++) {
    if (i >= uStrandCount) break;

    float fi = float(i);
    float ph = fi * 1.7 * uSpread;
    float freq = (2.0 + fi * 0.35) * uWaviness;
    float spd = 1.4 + fi * 1.2;

    float tt = uTime * uSpeed;
    float w = sin(uv.x * freq + tt * spd + ph) * 0.60
            + sin(uv.x * freq * 1.1 - tt * spd * 0.7 + ph * 1.7) * 0.40;

    float amp = (0.1 + 0.02 * e) * env * uAmplitude;
    float y = w * amp;

    float d = abs(uv.y - y);
    float thick = (0.001 + 0.05 * e) * (0.35 + env) * uThickness;
    float g = thick / (d + thick * 0.45);
    g = g * g;

    float h = fi / float(uStrandCount) + uv.x * 0.30 + uTime * 0.04 + uHueShift;
    col += strandColor(h) * g * env;
  }

  col *= 0.45 + 0.7 * e;
  col = 1.0 - exp(-col * uGlow);

  float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(gray), col, uSaturation), 0.0);

  float lum = max(max(col.r, col.g), col.b);
  float alpha = clamp(lum, 0.0, 1.0) * uOpacity;

  fragColor = vec4(col * uOpacity, alpha);
}
`;

/* ─── Helpers ─── */

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return [((bigint >> 16) & 255) / 255, ((bigint >> 8) & 255) / 255, (bigint & 255) / 255];
};

const buildPalette = (colors: string[]) => {
  const filled = colors && colors.length ? colors : ["#ffffff"];
  const padded: number[][] = [];
  for (let i = 0; i < MAX_COLORS; i++) {
    const hex = filled[i] ?? filled[filled.length - 1];
    padded.push(hexToRgb(hex));
  }
  return padded;
};

/* ─── Component ─── */

export default function Strands({
  colors = ["#190E85", "#00E0FF", "#CF00FF", "#03CF94"],
  count = 6,
  speed = 0.4,
  amplitude = 0.5,
  waviness = 2,
  thickness = 0.5,
  glow = 2,
  taper = 4,
  spread = 2,
  hueShift = 0,
  intensity = 0.5,
  saturation = 1.3,
  opacity = 0.35,
  scale = 1.8,
  className = "",
  style,
}: {
  colors?: string[];
  count?: number;
  speed?: number;
  amplitude?: number;
  waviness?: number;
  thickness?: number;
  glow?: number;
  taper?: number;
  spread?: number;
  hueShift?: number;
  intensity?: number;
  saturation?: number;
  opacity?: number;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const propsRef = useRef<any>({});
  propsRef.current = {
    colors, count, speed, amplitude, waviness, thickness,
    glow, taper, spread, hueShift, intensity, saturation, opacity, scale,
  };
  const ctnDom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    // Bail if WebGL2 is missing
    const testCanvas = document.createElement("canvas");
    if (!testCanvas.getContext("webgl2")) {
      console.warn("WebGL2 not supported — Strands background disabled");
      return;
    }

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio, 2),
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const canvasEl = gl.canvas as HTMLCanvasElement;
    canvasEl.style.display = "block";
    canvasEl.style.width = "100%";
    canvasEl.style.height = "100%";

    const geometry = new Triangle(gl);
    if ((geometry.attributes as any).uv) {
      delete (geometry.attributes as any).uv;
    }

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [ctn.offsetWidth || 1, ctn.offsetHeight || 1] },
        uColors: { value: buildPalette(propsRef.current.colors) },
        uColorCount: { value: Math.min(propsRef.current.colors.length, MAX_COLORS) },
        uStrandCount: { value: Math.min(propsRef.current.count, MAX_STRANDS) },
        uSpeed: { value: speed },
        uAmplitude: { value: amplitude },
        uWaviness: { value: waviness },
        uThickness: { value: thickness },
        uGlow: { value: glow },
        uTaper: { value: taper },
        uSpread: { value: spread },
        uHueShift: { value: hueShift },
        uIntensity: { value: intensity },
        uOpacity: { value: opacity },
        uScale: { value: scale },
        uSaturation: { value: saturation },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(canvasEl);

    const resize = () => {
      if (!ctn) return;
      const w = ctn.offsetWidth || 1;
      const h = ctn.offsetHeight || 1;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value = [w, h];
    };

    const ro = new ResizeObserver(resize);
    ro.observe(ctn);
    resize();

    let animateId = 0;
    const update = (t: number) => {
      animateId = requestAnimationFrame(update);
      const cur = propsRef.current;

      program.uniforms.uTime.value = t * 0.001;
      program.uniforms.uColors.value = buildPalette(cur.colors);
      program.uniforms.uColorCount.value = Math.min(cur.colors.length, MAX_COLORS);
      program.uniforms.uStrandCount.value = Math.min(Math.max(Math.round(cur.count), 1), MAX_STRANDS);
      program.uniforms.uSpeed.value = cur.speed;
      program.uniforms.uAmplitude.value = cur.amplitude;
      program.uniforms.uWaviness.value = cur.waviness;
      program.uniforms.uThickness.value = cur.thickness;
      program.uniforms.uGlow.value = cur.glow;
      program.uniforms.uTaper.value = cur.taper;
      program.uniforms.uSpread.value = cur.spread;
      program.uniforms.uHueShift.value = cur.hueShift;
      program.uniforms.uIntensity.value = cur.intensity;
      program.uniforms.uOpacity.value = cur.opacity;
      program.uniforms.uScale.value = cur.scale;
      program.uniforms.uSaturation.value = cur.saturation;

      renderer.render({ scene: mesh });
    };
    animateId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animateId);
      ro.disconnect();
      if (ctn && canvasEl.parentNode === ctn) ctn.removeChild(canvasEl);
      const loseContext = (gl as any).getExtension("WEBGL_lose_context");
      if (loseContext) loseContext.loseContext();
    };
  }, []);

  return (
    <div
      ref={ctnDom}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "transparent",
        ...style,
      }}
    />
  );
}