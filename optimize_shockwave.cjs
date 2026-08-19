const fs = require('fs');
let file = fs.readFileSync('src/components/WebGLShockwave.tsx', 'utf8');

const renderOptimization = `
      const currentTime = performance.now() / 1000 - startTimeRef.current;
      let isActive = false;
      for (let i = 0; i < shockwavesRef.current.length; i++) {
        if (currentTime - shockwavesRef.current[i].startTime < 4.0) {
          isActive = true;
          break;
        }
      }

      if (!isActive) {
        // Just loop, don't do expensive WebGL calls
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
`;

file = file.replace(/      if \(canvas\.width !== displayWidth \|\| canvas\.height !== displayHeight\) {/, renderOptimization);

// Also we should ensure the canvas is cleared when transitioning to inactive
const transitionToInactive = `
      if (!isActive) {
        // Clear canvas once before sleeping
        if (gl.getParameter(gl.COLOR_CLEAR_VALUE)[3] !== 0) {
           gl.clearColor(0, 0, 0, 0);
           gl.clear(gl.COLOR_BUFFER_BIT);
        }
        animationFrameId = requestAnimationFrame(render);
        return;
      }
`;
file = file.replace(/      if \(!isActive\) {\n        \/\/ Just loop, don't do expensive WebGL calls\n        animationFrameId = requestAnimationFrame\(render\);\n        return;\n      }/, transitionToInactive);

fs.writeFileSync('src/components/WebGLShockwave.tsx', file);
