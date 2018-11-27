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

    const layer1 = new RenderLayer();
    layer1.render = (now) => {
        gl.clearColor(0, 0.5, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    const layer2 = new RenderLayer();
    layer2.render = (now) => {
        gl.clearColor(0, 0, 0.5, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    renderer = new Renderer(1920, 1080, 
        canvas.clientWidth, canvas.clientHeight,
        [layer1, layer2], [BlendMode.ADD, BlendMode.ADD]);
    
    render(0);
}

function render(now) {
    renderer.render(now);
    requestAnimationFrame(render);
}
