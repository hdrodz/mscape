"use strict";

//
// main.js -- Application entry point
//

const radians = deg => deg * Math.PI / 180;
const degrees = rad => rad * 180 / Math.PI;

/**
 * Speed of the wheels, in degrees per second
 */
const WHEEL_SPEED = 10;

const WHEEL_DELTA_QUAT = quat.fromEuler(quat.create(), WHEEL_SPEED, 0, 0);

/**
 * Time of the last frame
 */
var then = 0;

/**
 * @type {Renderer}
 */
var renderer = undefined;

/**
 * @type {WebAudioSession}
 */
var audioSesh = undefined;

const buff = new Uint8Array(8192);

/**
 * @type {Camera}
 */
var camera = undefined;

function loadAll(files) {
    return Promise.all(files.map(
        file => file.blob ? loadFileBlobAsync(file.path) : loadFileTextAsync(file.path)
    ));
}

window.addEventListener('load', () => {
    const player = document.getElementById("player");
    audioSesh = new WebAudioSession(player, 8192);

    const canvas = document.getElementById("canvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    tryInitWebGL(canvas);

    loadAll([
        { path: "assets/zoomscape/zoomscape.obj", blob: false },
        { path: "assets/zoomscape/wheel.obj", blob: false },
        { path: "shaders/default3d.vert", blob: false },
        { path: "shaders/dumbshader.frag", blob: false },
        { path: "shaders/line.frag", blob: false },
        { path: "shaders/grid.vert", blob: false },
        { path: "shaders/grid.frag", blob: false }
    ]).then(values => {
            const car = values[0];
            const wheel = values[1];
            const mvst = values[2];
            const mfst = values[3];
            const line = values[4];
            const gvst = values[5];
            const gfst = values[6];

            const meshProg = gl.createProgram();
            const mvs = tryCompileShader(gl.VERTEX_SHADER, mvst);
            const mfs = tryCompileShader(gl.FRAGMENT_SHADER, mfst);
            compileAndRegister(meshProg, mvs, mfs, "meshDefault");

            const gridProg = gl.createProgram();
            const gvs = tryCompileShader(gl.VERTEX_SHADER, gvst);
            const gfs = tryCompileShader(gl.FRAGMENT_SHADER, gfst);
            compileAndRegister(gridProg, gvs, gfs, "grid");

            initScene(canvas, car, wheel, line);
        });
});

function initBackground(text) {
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
        1, 1,
        -1, 1,
        -1, -1,
        1, -1,
        1, 1
    ]);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, planePoints, gl.STATIC_DRAW);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 4096, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, buff);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const layer = new RenderLayer();
    layer.render = (now) => {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(prog);

        audioSesh.analyser.getByteTimeDomainData(buff);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 8192, 1, 0, gl.LUMINANCE,
            gl.UNSIGNED_BYTE, buff);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        var reverseLightDirectionLocation =
        gl.getUniformLocation(prog, "u_reverseLightDirection");

        gl.uniform3fv(reverseLightDirectionLocation, [0, -5, 25]);

        const uTex = gl.getUniformLocation(prog, "tex");
        gl.uniform1i(uTex, 1);

        const att = gl.getAttribLocation(prog, "position");
        gl.vertexAttribPointer(att, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(att);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    return layer;
}

var scene;

function initCar(carObj, wheelObj) {
    const wheelTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, wheelTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
        gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));
    
    const wheelImage = new Image();
    wheelImage.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, wheelTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, wheelImage);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }
    wheelImage.src = "assets/zoomscape/wheel.png";

    const wheelMesh = new OBJ.Mesh(wheelObj);
    const wheels = [
        new MeshObject("fl", wheelMesh),
        new MeshObject("fr", wheelMesh),
        new MeshObject("rl", wheelMesh),
        new MeshObject("rr", wheelMesh)
    ];
    const q = quat.fromEuler(quat.create(), 0, 90, 0);
    // Assign each update function
    wheels.forEach(w => {
        w.texture = wheelTex;
        w.transform.rotateAbs(q).scaleAbs([0.8, 0.8, 0.8]);
        w.update = now => {
            w.transform.rotateBy(WHEEL_DELTA_QUAT);
        }
    });

    // Setup the wheels' relative positions
    const v = vec3.create();
    vec3.set(v, 2 + 1.5 / 2 - 0.2, 0.5, -4.5);
    wheels[0].transform.translateAbs(v);
    vec3.set(v, -(2 + 1.5 / 2 - 0.2), 0.5, -4.5);
    wheels[1].transform.translateAbs(v);
    vec3.set(v, 2 + 1.5 / 2 - 0.2, 0.5, 4);
    wheels[2].transform.translateAbs(v);
    vec4.set(v, -(2 + 1.5 / 2 - 0.2), 0.5, 4);
    wheels[3].transform.translateAbs(v);

    const carMesh = new OBJ.Mesh(carObj);
    const car = new MeshObject("car", carMesh);
    car.children.push(...wheels);

    const carTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, carTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
        gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));

    const carImage = new Image();
    carImage.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, carTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, carImage);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }
    carImage.src = "assets/zoomscape/body.png";
    
    car.texture = carTex;

    return car;
}

function initScene(canvas, car, wheel, line_text) {
    const bg = initBackground(line_text);
    const co = initCar(car, wheel);

    camera = new PerspectiveCamera(
        radians(49.1), 1920 / 1080,
        0.1, 100
    );
    camera.world.translateAbs([0, 10, -25])
        .rotateAbs(quat.fromEuler(quat.create(), -10, 180, 0));

    const r = quat.create();

    const grid = new LightGridObject("grid", {
        width: 20,
        height: 20,
        unit: 10,
        thickness: 0.125,
        color: [1, 0, 1, 1]
    });
    grid.transform.rotateBy(quat.fromEuler(r, -90, 0, 0));
    grid.update = (now) => {
        grid.transform.translateAbs([5, -0.5 - grid.thickness / 2, (-now / 50) % 10]);
    }

    scene = new Scene(camera, PROGRAMS["meshDefault"].glref);

    scene.root.children.push(co);
    scene.root.children.push(grid);

    renderer = new Renderer(1920, 1080,
        canvas.width, canvas.height,
        [bg, scene],
        [BlendMode.ADD, BlendMode.NORMAL]
    );
    window.onresize = () => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        renderer.resize(canvas.width, canvas.height);
    }
    render(0);
}

function render(now) {
    renderer.render(now);
    requestAnimationFrame(render);
}

window.onkeydown = on_key;

const v = vec3.create();
const q = quat.create();
function on_key(e) {
    const STEP = 0.1;
    const RSTEP = 1;
    vec3.set(v, 0, 0, 0);
    quat.identity(q);
    switch (e.key) {
    case "X":
        vec3.set(v, -STEP, 0, 0);
        break;
    case "x":
        vec3.set(v, STEP, 0, 0);
        break;
    case "Y":
        vec3.set(v, 0, -STEP, 0);
        break;
    case "y":
        vec3.set(v, 0, STEP, 0);
        break;
    case "Z":
        vec3.set(v, 0, 0, -STEP);
        break;
    case "z":
        vec3.set(v, 0, 0, STEP);
        break;

    case "ArrowRight":
        quat.fromEuler(q, 0, RSTEP, 0, 0);
        break;
    case "ArrowLeft":
        quat.fromEuler(q, 0, -RSTEP, 0, 0);
        break;
    case "ArrowUp":
        quat.fromEuler(q, RSTEP, 0, 0);
        break;
    case "ArrowDown":
        quat.fromEuler(q, -RSTEP, 0, 0);
        break;
    }
    camera.world.translateBy(v).rotateBy(q);
    const p = camera.world.translate;
    const r = camera.world.rotate;
    document.getElementById("position").innerText = `(${p[0]}, ${p[1]}, ${p[2]})`;
    document.getElementById("rotation").innerText = `${r[0]} + ${r[1]}i + ${r[2]}j + ${r[3]}k`;
}
