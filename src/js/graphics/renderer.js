"use strict";

/**
 * An atomic part of the rendering system. Renders its contents individually.
 */
class RenderLayer {
    /**
     * Renders this layer.
     * @param {Number} now The application time, in seconds.
     */
    render(now) { }
}

/**
 * Used during composition of renderer layers.
 */
const BlendMode = Object.freeze({
    NORMAL: {
        value: 1,
        code:
        // Source: https://en.wikipedia.org/wiki/Alpha_compositing#Alpha_blending 
        `ret.a = next.a + cur.a * (1. - next.a);
        ret.rgb = (next.rgb * next.a + cur.rgb * ret.a) / ret.a;`
    },
    ADD: {
        value: 2,
        code: `ret = cur + next;`
    },
    MULTIPLY: {
        value: 3,
        code: `ret = cur * next;`
    }
});

/**
 * Coordinates rendering things onto the screen.
 */
class Renderer {
    /**
     * Create a new renderer.
     * @param {Number} renderWidth Rendered scene width, in pixels.
     * @param {Number} renderHeight Rendered scene height, in pixels.
     * @param {Number} width Target medium width, in pixels.
     * @param {Number} height Target medium height, in pixels.
     * @param {Array<RenderLayer>} layers Layers to use during rendering.
     * @param {Array<BlendMode>} blendModes How to blend each layer with its previous layer.
     */
    constructor(renderWidth, renderHeight, width, height, layers, blendModes) {
        requireGLContext();
        /**
         * Render layers in the renderer.
         * @type {Array<RenderLayer>}
         */
        this.layers = layers;
        /**
         * Width of the rendered scene, in pixels.
         */
        this.renderWidth = renderWidth;
        /**
         * Height of the rendered scene, in pixels.
         */
        this.renderHeight = renderHeight;
        /**
         * Associated framebuffers for each of the render layers.
         */
        this.buffers = layers.map(_ => ({
            /**
             * Target texture of the frame buffer.
             * @type {WebGLTexture}
             */
            texture: gl.createTexture(),
            /**
             * Frame buffer.
             * @type {WebGLFramebuffer}
             */
            framebuffer: gl.createFramebuffer()
        }));
        /**
         * How to blend each layer with its previous layer.
         */
        this.blendModes = blendModes;
        /**
         * True if the renderer is ready to start rendering, i.e. all necessary
         * resources are loaded and generated.
         */
        this.ready = false;
        /**
         * The shader program that composes all of the render layers.
         * @type {WebGLProgram}
         */
        this.composeProgram = null;
        /**
         * Locations of the texture uniforms in the compose shader.
         * @type {Array<WebGLUniformLocation>}
         */
        this.layerUniforms = null;
        /**
         * The width of the target medium, in pixels.
         */
        this.width = width;
        /**
         * The height of the target medium, in pixels.
         */
        this.height = height;
        /**
         * Buffer to store the transfer plane.
         * @type {WebGLBuffer}
         */
        this.planeBuff = null;
        /**
         * Background color of the renderer.
         */
        this.clearColor = {
            r: 100 / 255, g: 149 / 255, b: 237 / 255, a: 255 / 255
        };

        this.setupFramebuffers();

        loadFileTextAsync("shaders/compose.frag.template")
            .then(this.finalizeInitialization.bind(this), alertOnReject);
    }

    /**
     * Set up the framebuffers for each of the render layers.
     */
    setupFramebuffers() {
        for (var i = 0; i < this.layers.length; ++i) {
            // Set up the blank texture
            gl.bindTexture(gl.TEXTURE_2D, this.buffers[i].texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.renderWidth,
                this.renderHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            // Set up the framebuffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffers[i].framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D, this.buffers[i].texture, 0);
        }
    }

    /**
     * Create the transfer plane, a plane that all of the composed layers will
     * render onto.
     */
    setupTransferPlane() {
        const plane = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1
        ]);

        this.planeBuff = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.planeBuff);
        gl.bufferData(gl.ARRAY_BUFFER, plane, gl.STATIC_DRAW);
    }

    /**
     * Set up the rendering parameters for the transfer plane.
     */
    transferPlanePreRender() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.planeBuff);
        const attPosition = gl.getAttribLocation(this.composeProgram, "position");
        gl.vertexAttribPointer(attPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attPosition);
    }

    /**
     * Set the new width and height of the transfer medium.
     * @param {Number} width The new width of the transfer medium.
     * @param {Number} height The new height of the transfer medium.
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    /**
     * Finalize initializing the Renderer. This involves generating and
     * compiling the compose shader, setting up the transfer plane, and
     * setting the ready flag.
     * @param {String} composeShaderTemplate Template for the compose shader
     */
    finalizeInitialization(composeShaderTemplate) {
        this.generateComposeShader(composeShaderTemplate);

        this.layerUniforms = this.layers.map(
            (_, i) => gl.getUniformLocation(this.composeProgram, `input${i}`)
        );

        this.setupTransferPlane();

        this.ready = true;
    }

    /**
     * Generate the shader that composes all of the layers together and
     * compile it.
     * @param {String} template Template for the composition shader.
     */
    generateComposeShader(template) {
        const textureDeclarations = this.layers.map(
            (_, i) => `uniform sampler2D input${i};`
        ).join('\n');
        const compositionStatements = this.blendModes.map(
            (mode, i) => `next = texture2D(input${i}, position_norm);
            ${mode.code}
            cur = ret;`
        ).join('\n');

        const shaderText = template
            .replace("$TEXTURE_DECLARATIONS", textureDeclarations) 
            .replace("$COMPOSITION_STATEMENTS", compositionStatements);

        id_vs = id_vs || tryCompileShader(gl.VERTEX_SHADER, IDENTITY_VS);
        const composeFs = tryCompileShader(gl.FRAGMENT_SHADER, shaderText);

        this.composeProgram = gl.createProgram();
        gl.attachShader(this.composeProgram, id_vs);
        gl.attachShader(this.composeProgram, composeFs);
        gl.linkProgram(this.composeProgram);
        if (!gl.getProgramParameter(this.composeProgram, gl.LINK_STATUS)) {
            throw gl.getProgramInfoLog(this.prog);
        }
    }

    /**
     * Render the layers set up in the renderer.
     * @param {Number} now Current application time.
     */
    render(now) {
        // Don't render until we're ready
        if (!this.ready)
            return;
        // Render all of the layers
        gl.viewport(0, 0, this.renderWidth, this.renderHeight);
        for (var i = 0; i < this.layers.length; ++i) {
            this.renderLayer(now, i);
        }
        // Compose the layers
        gl.viewport(0, 0, this.width, this.height);
        this.compose();
    }

    /**
     * Render a single layer to its respective framebuffer.
     * @param {Number} now Current application time.
     * @param {Number} index Index of the render layer to render.
     */
    renderLayer(now, index) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffers[index].framebuffer);
        this.layers[index].render(now);
    }

    /**
     * Compose all of the layers onto the screen.
     */
    compose() {
        // Draw to the screen, not to the last framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(this.composeProgram);
        // Clear the screen
        gl.clearColor(this.clearColor.r, this.clearColor.g, 
            this.clearColor.b, this.clearColor.a);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // Bind the textures
        this.buffers.forEach((buf, i) => {
            gl.activeTexture(gl.TEXUTRE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, buf.texture);
            gl.uniform1i(this.layerUniforms[i], i);
        });
        // Render the plane on-screen
        this.transferPlanePreRender();
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}
