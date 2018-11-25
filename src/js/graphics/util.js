"use strict";

//
// graphics/util.js -- GL utilities
//

var gl = null;

/**
 * Crash in the absence of a valid WebGL context assigned to the variable gl.
 */
function requireGLContext() {
    if (!gl)
        throw "No active WebGL context";
}

/**
 * Tries to init WebGL, as well as the global "gl" context variable.
 * @param {HTMLCanvasElement} canvas Canvas to extract the GL context from.
 */
function tryInitWebGL(canvas) {
    gl = canvas.getContext("webgl");
    if (!gl)
        throw "Failed to create WebGL context";
}
