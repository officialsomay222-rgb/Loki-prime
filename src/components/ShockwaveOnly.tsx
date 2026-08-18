import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  varying vec2 v_uv;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_shockwaves[10]; // x: normX, y: normY, z: startTime
  uniform float u_waveSpeed;
  uniform float u_waveThickness;
  uniform float u_waveGlow;
  uniform float u_particleSpeed;

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = uv;
    p.x *= aspect;

    vec3 accumColor = vec3(0.0);
    float accumAlpha = 0.0;

    // 8 Saturated, High-Contrast Cosmic Spectral Wavelengths
    vec3 cCyan     = vec3(0.00, 0.95, 1.00); // Electric Cyan
    vec3 cViolet   = vec3(0.55, 0.12, 1.00); // Neon Violet
    vec3 cPink     = vec3(1.00, 0.02, 0.58); // Synthwave Pink
    vec3 cGold     = vec3(1.00, 0.74, 0.00); // Solar Flare Gold
    vec3 cEmerald  = vec3(0.00, 1.00, 0.58); // Matrix Emerald
    vec3 cAzure    = vec3(0.00, 0.55, 1.00); // High-Voltage Azure
    vec3 cCoral    = vec3(1.00, 0.22, 0.28); // Supernova Coral
    vec3 cMagenta  = vec3(0.85, 0.05, 0.95); // Royal Orchid

    for (int i = 0; i < 10; i++) {
      float startTime = u_shockwaves[i].z;
      if (startTime <= 0.0) continue;

      float age = u_time - startTime;
      if (age > 0.0 && age < 4.0) {
        vec2 center = u_shockwaves[i].xy;
        center.x *= aspect;

        float dist = distance(p, center);
        float angle = atan(p.y - center.y, p.x - center.x);

        float shimmer = sin(angle * 6.0 + age * 4.0) * 0.003;
        float effectiveDist = dist + shimmer;

        float currentRadius = age * 0.85 * u_waveSpeed;
        float baseThick = (0.014 + age * 0.016) * u_waveThickness;

        float originDamp = smoothstep(0.015, 0.08, currentRadius);
        float lifeFade = smoothstep(4.0, 0.0, age) * smoothstep(0.0, 0.06, age);

        for (int j = 0; j < 8; j++) {
          float ringOffset = float(j) * (0.034 + age * 0.008);
          float ringR = currentRadius - ringOffset;

          if (ringR > 0.005) {
            float d = abs(effectiveDist - ringR);
            float thick = baseThick * (1.0 + float(j) * 0.08);

            float ringCore = exp(-pow(d / thick, 2.0));
            float auraGlow = exp(-d * 20.0) * 0.50 * u_waveGlow;

            float intensity = (ringCore * 0.85 + auraGlow) * originDamp * lifeFade;

            vec3 ringColor;
            if (j == 0) ringColor = cCyan;
            else if (j == 1) ringColor = cViolet;
            else if (j == 2) ringColor = cPink;
            else if (j == 3) ringColor = cGold;
            else if (j == 4) ringColor = cEmerald;
            else if (j == 5) ringColor = cAzure;
            else if (j == 6) ringColor = cCoral;
            else ringColor = cMagenta;

            accumColor += ringColor * intensity;
            accumAlpha += intensity * 0.60;
          }
        }
      }
    }

    vec3 toneMappedColor = accumColor / (1.0 + accumColor * 0.45);
    float finalAlpha = clamp(accumAlpha, 0.0, 0.80);

    gl_FragColor = vec4(toneMappedColor, finalAlpha);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export interface WebGLCanvasRef {
  triggerShockwave: (normalizedX: number, normalizedY: number) => void;
}

export interface ShockwaveConfig {
  waveSpeed: number;
  waveThickness: number;
  waveGlow: number;
  particleSpeed: number;
}

export interface ShockwaveOnlyProps {
  config?: ShockwaveConfig;
  originX?: number;
  originY?: number;
}

export const ShockwaveOnly = forwardRef<WebGLCanvasRef, ShockwaveOnlyProps>(({ config, originX, originY }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const configRef = useRef(config || {
    waveSpeed: 1.0,
    waveThickness: 1.0,
    waveGlow: 1.0,
    particleSpeed: 1.0
  });

  useEffect(() => {
    if (config) {
      configRef.current = config;
    }
  }, [config]);

  const shockwavesRef = useRef<Array<{ x: number, y: number, startTime: number }>>([]);
  const startTimeRef = useRef<number>(performance.now() / 1000);

  const triggerShockwave = (normalizedX: number, normalizedY: number) => {
    const currentTime = performance.now() / 1000 - startTimeRef.current;
    shockwavesRef.current.push({
      x: normalizedX,
      y: normalizedY,
      startTime: currentTime
    });

    if (shockwavesRef.current.length > 10) {
      shockwavesRef.current.shift();
    }
  };

  useImperativeHandle(ref, () => ({
    triggerShockwave
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
    const shockwavesUniformLocation = gl.getUniformLocation(program, 'u_shockwaves');
    const waveSpeedUniformLocation = gl.getUniformLocation(program, 'u_waveSpeed');
    const waveThicknessUniformLocation = gl.getUniformLocation(program, 'u_waveThickness');
    const waveGlowUniformLocation = gl.getUniformLocation(program, 'u_waveGlow');
    const particleSpeedUniformLocation = gl.getUniformLocation(program, 'u_particleSpeed');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    let animationFrameId: number;

    const render = () => {
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      const currentTime = performance.now() / 1000 - startTimeRef.current;
      gl.uniform1f(timeUniformLocation, currentTime);

      gl.uniform1f(waveSpeedUniformLocation, configRef.current.waveSpeed);
      gl.uniform1f(waveThicknessUniformLocation, configRef.current.waveThickness);
      gl.uniform1f(waveGlowUniformLocation, configRef.current.waveGlow);
      gl.uniform1f(particleSpeedUniformLocation, configRef.current.particleSpeed);

      const shockwaveData = new Float32Array(30);
      for (let i = 0; i < 10; i++) {
        if (i < shockwavesRef.current.length) {
          shockwaveData[i * 3 + 0] = shockwavesRef.current[i].x;
          shockwaveData[i * 3 + 1] = shockwavesRef.current[i].y;
          shockwaveData[i * 3 + 2] = shockwavesRef.current[i].startTime;
        } else {
          shockwaveData[i * 3 + 0] = 0;
          shockwaveData[i * 3 + 1] = 0;
          shockwaveData[i * 3 + 2] = -1.0;
        }
      }
      gl.uniform3fv(shockwavesUniformLocation, shockwaveData);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  useEffect(() => {
    const ox = typeof originX === 'number' ? originX : 0.85;
    const oy = typeof originY === 'number' ? originY : 0.92;

    triggerShockwave(ox, oy);

    const t1 = setTimeout(() => triggerShockwave(ox, oy), 280);
    const t2 = setTimeout(() => triggerShockwave(ox, oy), 620);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [originX, originY]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[998] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
});

export default ShockwaveOnly;
