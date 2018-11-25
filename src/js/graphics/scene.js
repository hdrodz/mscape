"use strict";

//
// scene.js -- The scene graph model
//

/**
 * High-level abstraction for object transformation matrix manipulation.
 */
class Transform {
    /**
     * Initialize a default transformation. This means there is no translation,
     * no rotation, and a scale of 1.
     */
    constructor() {
        /**
         * True if a mutation has been performed on the Transform and the
         * matrix has not yet been updated.
         */
        this.dirty = false;
        /**
         * Internal transformation matrix of the Transform. Because this value
         * is not automatically updated, you should use Transform.matrix to
         * access the internal matrix as that property will update this value
         * if necessary and return the proper transformation matrix.
         */
        this._mat = mat4.create();
        /**
         * Inverse of the internal transformation matrix of the Transform. This
         * is used to unapply the transformation when walking the object tree.
         */
        this._inv = mat4.create();
        /**
         * Translation from the origin.
         */
        this.translate = vec3.create();
        /**
         * Rotation about the origin.
         */
        this.rotate = quat.create();
        /**
         * Scale.
         */
        this.scale = vec3.fromValues(1, 1, 1);
    }

    /**
     * Sets this transform's absolute scale.
     * @param {vec3} v The new scale vector of the transformation.
     * @returns {Transform} this, to allow for operation chaining.
     */
    scaleAbs(v) {
        vec3.copy(this.scale, v);
        this.dirty = true;
        return this;
    }

    /**
     * Modifies this transform's current scale by a value.
     * @param {vec3} v The vector by which the current scale will be modified.
     * @returns {Transform} this, to allow for operation chaining.
     */
    scaleBy(v) {
        vec3.mul(this.scale, this.scale, v);
        this.dirty = true;
        return this;
    }

    /**
     * Sets this transform's absolute rotation.
     * @param {quat} q The new rotation quaternion of the transformation.
     * @returns {Transform} this, to allow for operation chaining.
     */
    rotateAbs(q) {
        quat.copy(this.rotate, q);
        this.dirty = true;
        return this;
    }

    /**
     * Modifies this transform's current rotation by a value.
     * @param {quat} q The quaternion by which the current rotation will be 
     *                 modified.
     * @returns {Transform} this, to allow for operation chaining.
     */
    rotateBy(q) {
        quat.mul(this.rotate, this.rotate, q);
        this.dirty = true;
        return this;
    }

    /**
     * Sets this transform's absolute translation.
     * @param {vec3} v The new translation vector of the transformation.
     * @returns {Transform} this, to allow for operation chaining.
     */
    translateAbs(v) {
        vec3.copy(this.translate, v);
        this.dirty = true;
        return this;
    }

    /**
     * Modifies this transform's current position by a value.
     * @param {vec3} v The vector by which the current translation will be
     *                 modified.
     * @returns {Transform} this, to allow for operation chaining.
     */
    translateBy(v) {
        vec3.add(this.translate, this.translate, v);
        this.dirty = true;
        return this;
    }

    /**
     * Update the internal and internal inverse matrices and clear the dirty
     * flag.
     */
    refreshMatrices() {
        mat4.fromRotationTranslationScale(this._mat, this.rotate,
            this.tranlsate, this.scale);
        mat4.inv(this._inv, this._mat);
        this.dirty = false;
    }

    /**
     * Updates the internal transformation matrix if necessary and fetches it.
     */
    get matrix() {
        if (this.dirty) {
            this.refreshMatrices();
        }
        return this._mat;
    }

    /**
     * Updates the internal inverse matrix if necessary and fetches it.
     */
    get inverseMatrix() {
        if (this.dirty) {
            this.refreshMatrices();
        }
        return this._inv;
    }
}

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
    constructor() {
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
        // TODO: setup cameras
    }

    /**
     * Update and render the nodes of this scene.
     * @param {Number} now Application time, in seconds.
     */
    render(now) {
        this.update(now, this.root);
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
        // Render the node and its children
        node.render(now, this.totalTrans);
        node.children.forEach(child => this.render(now, child));
        // De-apply this node's transformation matrix
        mat4.mul(this.totalTrans, node.transform.inverseMatrix, this.totalTrans);
    }
}
