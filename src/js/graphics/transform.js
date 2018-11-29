"use strict";

//
// transform.js -- Abstractions for 3D transformations
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