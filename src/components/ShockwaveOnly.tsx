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

  vec3 getAuthenticRainbow(float t) {
    t = clamp(t, 0.0, 1.0);
    if (t < 0.166) {
      float f = t / 0.166;
      return mix(vec3(1.00, 0.05, 0.15), vec3(1.00, 0.45, 0.00), f);
    } else if (t < 0.333) {
      float f = (t - 0.166) / 0.167;
      return mix(vec3(1.00, 0.45, 0.00), vec3(1.00, 0.90, 0.00), f);
    } else if (t < 0.500) {
      float f = (t - 0.333) / 0.167;
      return mix(vec3(1.00, 0.90, 0.00), vec3(0.00, 0.95, 0.35), f);
    } else if (t < 0.666) {
      float f = (t - 0.500) / 0.166;
      return mix(vec3(0.00, 0.95, 0.35), vec3(0.00, 0.80, 1.00), f);
    } else if (t < 0.833) {
      float f = (t - 0.666) / 0.167;
      return mix(vec3(0.00, 0.80, 1.00), vec3(0.25, 0.20, 1.00), f);
    } else {
      float f = (t - 0.833) / 0.167;
      return mix(vec3(0.25, 0.20, 1.00), vec3(0.85, 0.05, 0.90), f);
    }
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = uv;
    p.x *= aspect;

    vec3 finalColor = vec3(0.0);
    float finalAlpha = 0.0;

    for (int i = 0; i < 10; i++) {
      float startTime = u_shockwaves[i].z;
      if (startTime <= 0.0) continue;

      float age = u_time - startTime;
      if (age > 0.0 && age < 3.2) {
        vec2 center = u_shockwaves[i].xy;
        center.x *= aspect;

        float dist = distance(p, center);
        float angle = atan(p.y - center.y, p.x - center.x);

        float shimmer = sin(angle * 6.0 + age * 3.5) * 0.0025 + cos(angle * 3.0 - age * 2.5) * 0.0015;
        float effectiveDist = dist + shimmer;

        float currentRadius = age * 0.46 * u_waveSpeed;
        float baseThick = (0.018 + age * 0.016) * u_waveThickness;

        float originDamp = smoothstep(0.008, 0.06, currentRadius);
        float lifeFade = smoothstep(3.2, 0.0, age) * smoothstep(0.0, 0.08, age);

        float sunRays = pow(max(0.0, sin(angle * 10.0 + age * 1.5) * cos(angle * 5.0 - age * 2.0)), 6.0);
        float rayIntensity = sunRays * exp(-dist * 2.2) * 0.28 * originDamp * lifeFade;
        vec3 rayColor = vec3(1.00, 0.88, 0.45);
        finalColor += rayColor * rayIntensity;
        finalAlpha = max(finalAlpha, rayIntensity * 0.40);

        for (int j = 0; j < 7; j++) {
          float spectralPos = float(j) / 6.0;
          float ringOffset = float(j) * (0.024 + age * 0.006);
          float ringR = currentRadius - ringOffset;

          if (ringR > 0.005) {
            float d = abs(effectiveDist - ringR);
            float thick = baseThick * (1.0 + float(j) * 0.06);

            float ringCore = exp(-pow(d / thick, 2.0));
            float sunGlint = exp(-pow(d / (thick * 0.25), 2.0)) * 0.75;
            float corona = exp(-d * 34.0) * 0.40 * u_waveGlow;

            float intensity = (ringCore + corona) * originDamp * lifeFade;
            vec3 spectralColor = getAuthenticRainbow(spectralPos);
            vec3 ringColor = mix(spectralColor, vec3(1.00, 0.98, 0.88), sunGlint * 0.48);

            finalColor += ringColor * intensity * 1.5;
            float layerAlpha = (ringCore * 0.88 + sunGlint * 0.45 + corona * 0.30) * originDamp * lifeFade;
            finalAlpha = max(finalAlpha, layerAlpha);
          }
        }
      }
    }

    vec3 toneMapped = (finalColor * (1.0 + finalColor * 0.30)) / (1.0 + finalColor * 0.60);
    finalAlpha = clamp(finalAlpha, 0.0, 0.90);

    gl_FragColor = vec4(clamp(toneMapped, 0.0, 1.0), finalAlpha);
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

    const t1 = setTimeout(() => triggerShockwave(ox, oy), 450);

    return () => {
      clearTimeout(t1);
    };
  }, [originX, originY]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[999999] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
});

export default ShockwaveOnly;
