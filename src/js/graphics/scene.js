"use strict";

//
// scene.js -- The scene graph model
//

/**
 * An object in a scene.
 */
class SceneObject {
    /**
     * Create a RenderObject
     * @param {String} name Name of the object.
     */
    constructor(name) {
        /**
         * Name of the object, for debugging purposes.
         */
        this.name = name;
        /**
         * 3D transformation of the object, relative to its parent.
         */
        this.transform = new Transform();
        /**
         * Child objects of this object.
         */
        this.children = [];
    }

    /**
     * Update the object.
     * @param {Number} now The time since the start of the app, in seconds.
     */
    update(now) { }

    /**
     * Render the object.
     * @param {Number} now The time since the start of the app, in seconds.
     * @param {mat4} totalTrans The cumulative transform matrix. This is the
     *                          matrix combining all of the transforms from the
     *                          perspective transformation to the camera
     *                          transformation, to the transformation of each
     *                          of this object's parent objects when walking
     *                          the tree.
     */
    render(now, totalTrans) { }
}

/**
 * A tree of objects that can be updated and rendered simultaneously.
 */
class Scene extends RenderLayer {
    /**
     * Creates a new scene.
     * @param {Camera} camera Set-up camera used for the scene.
     * @param {WebGLProgram} renderProgram Program to use for rendering.
     */
    constructor(camera, renderProgram) {
        /**
         * The root of the scene. Has no transformation and serves only to hold
         * children.
         * @type {SceneObject}
         */
        this.root = new SceneObject("origin");
        /**
         * The cumulative transformation, used during rendering.
         * @type {mat4}
         */
        this.totalTrans = mat4.create();
        /**
         * The camera used in this scene.
         * @type {Camera}
         */
        this.camera = camera;
        /**
         * Program used by default when rendering.
         * @type {WebGLProgram}
         */
        this.renderProgram = renderProgram;
        /**
         * Location of the transform matrix.
         * @type {WebGLUniformLocation}
         */
        this.transformLocation = gl.getUniformLocation(renderProgram, "transform");
    }

    /**
     * Update and render the nodes of this scene.
     * @param {Number} now Application time, in seconds.
     */
    render(now) {
        // First update all of the nodes
        this.update(now, this.root);
        
        // Reset the translation matrix and apply the camera matrix.
        mat4.identity(this.totalTrans);
        mat4.mul(this.totalTrans, this.camera.matrix, this.totalTrans);
        // Use the default render program
        gl.useProgram(this.renderProgram);
        // Then render all of the nodes
        this.renderNode(now, this.root);
    }

    /**
     * Updates a node and its children.
     * @param {Number} now Application time, in seconds.
     * @param {SceneObject} node Node to update.
     */
    update(now, node) {
        node.update(now);
        node.children.forEach(child => this.update(now, child));
    }

    /**
     * Renders a node and its children.
     * @param {Number} now Application time, in seconds.
     * @param {SceneObject} node Node to render.
     */
    renderNode(now, node) {
        // Apply this node's transformation matrix
        mat4.mul(this.totalTrans, node.transform.matrix, this.totalTrans);
        gl.uniformMatrix4fv(this.transformLocation, false, this.totalTrans);
        // Render the node and its children
        node.render(now, this.totalTrans);
        node.children.forEach(child => this.render(now, child));
        // De-apply this node's transformation matrix
        mat4.mul(this.totalTrans, node.transform.inverseMatrix, this.totalTrans);
    }
}
