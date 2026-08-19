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
    vec2 pos = uv;
    float aspect = u_resolution.x / u_resolution.y;
    pos.x *= aspect;
    
    vec3 color = vec3(0.0); // Transparent background
    float alpha = 0.0;
    
    // Google official brand colors
    vec3 cBlue = vec3(0.259, 0.522, 0.957);
    vec3 cRed = vec3(0.918, 0.263, 0.208);
    vec3 cYellow = vec3(0.984, 0.737, 0.020);
    vec3 cGreen = vec3(0.204, 0.659, 0.325);

    for (int i = 0; i < 10; i++) { // Max 10 simultaneous shockwaves
      float startTime = u_shockwaves[i].z;
      if (startTime <= 0.0) continue;
      float age = u_time - startTime;

      if (age > 0.0 && age < 4.0) {
        vec2 center = u_shockwaves[i].xy;
        center.x *= aspect; // apply aspect ratio to center
        
        float dist = distance(pos, center);
        float currentRadius = age * 0.7 * u_waveSpeed; // Speed of expansion
        float thickness = (0.02 + (age * 0.025)) * u_waveThickness; // Gets thicker as it expands
        
        // Loop over the 4 Google colors to make a rainbow wave
        for(int j = 0; j < 4; j++) {
          float offset = float(j) * (0.06 + age * 0.015);
          float r = currentRadius - offset;
          
          if (r > 0.0) {
            float ring = smoothstep(r - thickness, r, dist) - smoothstep(r, r + thickness, dist);
            
            vec3 ringColor;
            if (j == 0) ringColor = cBlue;
            else if (j == 1) ringColor = cRed;
            else if (j == 2) ringColor = cYellow;
            else ringColor = cGreen;
            
            // Fade out smoothly at end of life and fade in quickly at start
            float fade = smoothstep(4.0, 0.0, age) * smoothstep(0.0, 0.1, age);
            
            // Add a soft glow effect alongside the hard ring
            float glow = exp(-abs(dist - r) * 8.0) * 0.8 * u_waveGlow;
            
            color += ringColor * (ring + glow) * fade;
            alpha += (ring + glow) * fade;
          }
        }
      }
    }
    
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
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

export interface WebGLCanvasProps {
  config?: ShockwaveConfig;
  originX?: number;
  originY?: number;
}

export const WebGLShockwave = forwardRef<WebGLCanvasRef, WebGLCanvasProps>(({ config, originX, originY }, ref) => {
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

      const currentTime = performance.now() / 1000 - startTimeRef.current;
      let isActive = false;
      for (let i = 0; i < shockwavesRef.current.length; i++) {
        if (currentTime - shockwavesRef.current[i].startTime < 4.0) {
          isActive = true;
          break;
        }
      }


      if (!isActive) {
        // Clear canvas once before sleeping
        if (gl.getParameter(gl.COLOR_CLEAR_VALUE)[3] !== 0) {
           gl.clearColor(0, 0, 0, 0);
           gl.clear(gl.COLOR_BUFFER_BIT);
        }
        animationFrameId = requestAnimationFrame(render);
        return;
      }


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

export const WebGLCanvas = WebGLShockwave;
export default WebGLShockwave;
