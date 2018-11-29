"use strict";

/**
 * Texture used when no texture is available. Don't use this value directly,
 * call fallbackTexture() to guarantee that the value is initialized before
 * using it.
 * @type {WebGLTexture}
 */
var FALLBACK_TEXTURE = undefined;

/**
 * Gets the fallback texture, initializing it if it has not been already.
 * @type {WebGLTexture}
 */
function fallbackTexture() {
    requireGLContext();
    if (!FALLBACK_TEXTURE) {
        FALLBACK_TEXTURE = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, FALLBACK_TEXTURE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([
                255, 0, 255, 255,
                0, 0, 0, 255,
                0, 0, 0, 255,
                255, 0, 255, 255
            ]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }
    return FALLBACK_TEXTURE;
}

class MeshObject extends SceneObject {
    /**
     * 
     * @param {String} name Name of the object
     * @param {Mesh} mesh Mesh to get the data from
     */
    constructor(name, mesh) {
        super(name);
        /**
         * OBJ.Mesh object with the mesh data.
         * @type {Mesh}
         */
        this.mesh = mesh;
        OBJ.initMeshBuffers(gl, mesh);
        /**
         * ID of the shader to use.
         */
        this.shader = "meshDefault";
        /**
         * Texture to use on render.
         * @type {WebGLTexture}
         */
        this.texture = undefined;
        /**
         * Parameter to pass to glDrawElements() that indicates how the
         * vertices should be drawn, e.g. 
         */
        this.displayFunc = gl.TRIANGLES;
    }

    /**
     * Sets the shader and updates all shader values.
     */
    set shader(id) {
        /**
         * ID of the shader this mesh uses
         * @type {String}
         */
        this.shaderId = id;
        /**
         * GL handle of this mesh's shader
         * @type {WebGLProgram}
         */
        this.shaderProg = PROGRAMS[id].glref;

        /**
         * Location of the "transform" shader uniform variable.
         * @type {WebGLUniformLocation}
         */
        this.uTrans = findUniform(this.shaderId, "transform");
        /**
         * Location of the "texture" shader uniform variable.
         * @type {WebGLUniformLocation}
         */
        this.uTexture = findUniform(this.shaderId, "texture");

        this.attrVert = gl.getAttribLocation(this.shaderProg, "vertex");
        this.attrNorm = gl.getAttribLocation(this.shaderProg, "normal");
        if (this.mesh.vertexBuffer) {
            this.attrTexC = gl.getAttribLocation(this.shaderProg, "texcoord");
        } else {
            this.attrTexC = undefined;
        }
    }

    /**
     * Prepares the WebGL attrib parameters in preparation for rendering this
     * mesh.
     */
    setupAttribs() {
        gl.enableVertexAttribArray(this.attrVert);
        gl.enableVertexAttribArray(this.attrNorm);
        if (this.attrTexC) {
            gl.enableVertexAttribArray(this.attrTexC);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
        gl.vertexAttribPointer(this.attrVert, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
        gl.vertexAttribPointer(this.attrNorm, 3, gl.FLOAT, false, 0, 0);
        if (this.attrTexC) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.textureBuffer);
            gl.vertexAttribPointer(this.attrTexC, 2, gl.FLOAT, false, 0, 0);
        }
    }

    /**
     * Render the mesh on-screen
     * @param {Number} now Application time, in seconds.
     * @param {mat4} totalTrans Matrix representing the total transformation of
     *                          the mesh.
     */
    render(now, totalTrans) {
        // Activate the shader
        gl.useProgram(PROGRAMS[this.shaderId].glref);
        
        // Assign uniform values
        gl.uniformMatrix4fv(this.uTrans, false, totalTrans);
        gl.uniform1i(this.uTexture, 0);

        // Setup the texture, using a fallback texture if none is assigned.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture || fallbackTexture());
        
        // Render the mesh.
        this.setupAttribs();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
        gl.drawElements(this.displayFunc, this.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
}
