"use strict";

//
// main.js -- Application entry point
//

window.onload = () => {
    const canvas = document.getElementById("canvas");
    tryInitWebGL(canvas);

    const testLayer = new RenderLayer();
    testLayer.render = (now) => {
        gl.clearColor(0, 0.5, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    };

    const renderer = new Renderer(1920, 1080, 
        canvas.clientWidth, canvas.clientHeight,
        [testLayer], [BlendMode.NORMAL]);
    
    requestAnimationFrame(now => renderer.render(now));
}
