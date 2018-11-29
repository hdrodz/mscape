"use strict";

//
// camera.js -- Camera stuffs
//

/**
 * A virtual camera that's responsible for altering the viewport's view of the
 * world.
 */
class Camera {
    constructor() {
        this.dirty = false;
        /**
         * World transform. Moves the universal coordinate system to reflect
         * the camera's virtual transformation.
         */
        this.world = new Transform();
        /**
         * Projection matrix that distorts points to create the illusion of
         * whatever perspective system is desired.
         * @type {mat4}
         */
        this.proj = mat4.create();
        this._mat = mat4.create();
    }

    /**
     * If dirty, regenerates the internal matrix and returns it.
     */
    get matrix() {
        if (this.dirty || this.world.dirty) {
            mat4.mul(this._mat, this.world, this.proj);
            this.dirty = false;
        }
        return this._mat;
    }
}

/**
 * A camera that creates the illusion of depth.
 */
class PerspectiveCamera extends Camera {
    /**
     * Creates a new PerspectiveCamera.
     * @param {Number} fovy Field-of-view angle across the y-axis.
     * @param {Number} aspect Aspect ratio of the camera viewport.
     * @param {Number} near Distance to the near plane.
     * @param {Number} far Distance to the far plane.
     */
    constructor(fovy, aspect, near, far) {
        super();
        mat4.perspective(this.proj, fovy, aspect, near, far);
        this.dirty = true;
    }
}

/**
 * A camera that preserves distances between points in space.
 */
class OrthogonalCamera extends Camera {
    /**
     * Creates a new OrthogonalCamera.
     * @param {Number} left Coordinate of the left side of the bounding box
     * @param {Number} right Coordinate of the right side of the bounding box
     * @param {Number} bottom Coordinate of the bottom side of the bounding box
     * @param {Number} top Coordinate of the top side of the bounding box
     * @param {Number} near Coordinate of the near side of the bounding box
     * @param {Number} far Coordinate of the far side of the bounding box
     */
    constructor(left, right, bottom, top, near, far) {
        super();
        mat4.ortho(this.proj, left, right, bottom, top, near, far);
        this.dirty = true;
    }
}
