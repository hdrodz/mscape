"use strict";

//
// main.js -- Application entry point
//

/**
 * @type {Renderer}
 */
var renderer = undefined;

window.onload = () => {
    const canvas = document.getElementById("canvas");
    tryInitWebGL(canvas);

    const testLayer = new RenderLayer();
    testLayer.render = (now) => {
        gl.clearColor(0, 0.5, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    };

    renderer = new Renderer(1920, 1080, 
        canvas.clientWidth, canvas.clientHeight,
        [testLayer], [BlendMode.NORMAL]);
    
    render(0);
}

function render(now) {
    renderer.render(now);
    requestAnimationFrame(render);
}
