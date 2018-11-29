"use strict";

//
// main.js -- Application entry point
//

/**
 * @type {Renderer}
 */
var renderer = undefined;

/**
 * @type {WebAudioSession}
 */
var audioSesh = undefined;

const buff = new Uint8Array(8192);

window.onload = () => {
    const player = document.getElementById("player");
    audioSesh = new WebAudioSession(player, 8192);

    const canvas = document.getElementById("canvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    tryInitWebGL(canvas);

    /*
    const layer1 = new RenderLayer();
    layer1.render = (now) => {
        gl.clearColor(0, 0.4, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    const layer2 = new RenderLayer();
    layer2.render = (now) => {
        gl.clearColor(0, 0, 0.5, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    const layer3 = new RenderLayer();
    layer3.render = now => {
        gl.clearColor(1, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    renderer = new Renderer(1920, 1080,
            canvas.clientWidth, canvas.clientHeight,
            [layer1, layer2, layer3], [BlendMode.ADD, BlendMode.ADD, BlendMode.ADD]
        );
    render(0);
    */

    
    loadFileTextAsync("shaders/line.frag")
        .then(text => {
            id_vs = id_vs || tryCompileShader(gl.VERTEX_SHADER, IDENTITY_VS);
            const fs = tryCompileShader(gl.FRAGMENT_SHADER, text);
            
            const prog = gl.createProgram();
            gl.attachShader(prog, id_vs);
            gl.attachShader(prog, fs);
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                throw `Failed to compile: ${gl.getProgramInfoLog(prog)}`;
            }

            const planePoints = new Float32Array([
                -1, -1,
                -1, 1,
                1, -1,
                1, 1
            ]);
            const vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, planePoints, gl.STATIC_DRAW);

            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 256, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, buff);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            const layer = new RenderLayer();
            layer.render = (now) => {
                gl.clearColor(0, 0, 0, 1);
                gl.clear(gl.COLOR_BUFFER_BIT);

                gl.useProgram(prog);

                audioSesh.analyser.getByteTimeDomainData(buff);
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 256, 1, 0, gl.LUMINANCE,
                    gl.UNSIGNED_BYTE, buff);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

                const uTex = gl.getUniformLocation(prog, "tex");
                gl.uniform1i(uTex, 1);
                
                const att = gl.getAttribLocation(prog, "position");
                gl.vertexAttribPointer(att, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(att);

                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            };

            const points2 = new Float32Array([
                -1, -1,
                -1, 0,
                0, -1,
                -1, 0,
                0, -1,
                0, 0,

                0, 0,
                0, 1,
                1, 0,
                0, 1,
                1, 0,
                1, 1,
            ]);
            const vbo2 = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo2);
            gl.bufferData(gl.ARRAY_BUFFER, points2, gl.STATIC_DRAW);

            const otherVS = `
            attribute vec2 p;
            uniform mat4 t;
            uniform float time;
            varying vec2 pos;
            void main() {
                gl_Position = t * vec4(p, 0., 1.);
                pos = (gl_Position.xy + vec2(1., 1.)) / 2.;
            }
            `;
            const otherFS = `
            precision mediump float;
            varying vec2 pos;
            void main() {
                gl_FragColor = vec4(pos.x, 0., pos.y, 1.);
            }
            `;
            const ovs = tryCompileShader(gl.VERTEX_SHADER, otherVS);
            const ofs = tryCompileShader(gl.FRAGMENT_SHADER, otherFS);
            const prog2 = gl.createProgram();
            gl.attachShader(prog2, ovs);
            gl.attachShader(prog2, ofs);
            gl.linkProgram(prog2);

            const m = mat4.create();
            mat4.set(m,
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0.25e-20, 0.25e-20, 0.25e-20, 1);

            const layer2 = new RenderLayer();
            layer2.render = (now) => {
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                
                gl.useProgram(prog2);
                
                const u = gl.getUniformLocation(prog2, "t");
                gl.uniformMatrix4fv(u, false, m);
                //gl.uniform1f(gl.getUniformLocation(prog2, "time"), now / 1000);

                gl.bindBuffer(gl.ARRAY_BUFFER, vbo2);
                
                const att = gl.getAttribLocation(prog2, "p");
                gl.vertexAttribPointer(att, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(att);

                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 12);
            };

            renderer = new Renderer(1920, 1080,
                canvas.clientWidth, canvas.clientHeight,
                [layer, layer2], [BlendMode.NORMAL, BlendMode.NORMAL]
            );

            window.onresize = () => {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
                renderer.resize(canvas.clientWidth, canvas.clientHeight);
            }

            render(0);
        });
        
}

function render(now) {
    renderer.render(now);
    requestAnimationFrame(render);
}

function load_audio(file) {
    let player = document.getElementById("player");
    let srcurl = window.URL.createObjectURL(file);
    player.src = srcurl;
    player.load();
}
