"use strict";

//
// graphics/util.js -- GL utilities
//

/**
 * @type {WebGLRenderingContext}
 */
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
    
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
}

/**
 * 
 * @param {GLenum} status Status to convert to string.
 */
function glStatusString(status) {
    switch (status) {
    case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
        return "The framebuffer has an incomplete attachment.";
    case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
        return "Not all dimensions have the same width and height.";
    case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
        return "The framebuffer has no image attached.";
    case gl.FRAMEBUFFER_UNSUPPORTED:
        return "Some parameters passed to the framebuffer are unsupported for this platform.";
    default:
        return "Unknown error.";
    }
}
