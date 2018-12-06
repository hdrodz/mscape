"use strict";

//
// grid.js -- Light grid scene object
//

/**
 * Generates a cube centered at the given position.
 * @param {Number} cx Center x position
 * @param {Number} cy Center y position
 * @param {Number} cz Center z position
 * @param {Number} side Length of each side
 */
function cube(cx, cy, cz, side) {
    return [
        cx + side / 2, cy + side / 2, cz + side / 2,
        cx + side / 2, cy + side / 2, cz - side / 2,
        cx + side / 2, cy - side / 2, cz + side / 2,
        cx + side / 2, cy - side / 2, cz - side / 2,
        cx - side / 2, cy + side / 2, cz + side / 2,
        cx - side / 2, cy + side / 2, cz - side / 2,
        cx - side / 2, cy - side / 2, cz + side / 2,
        cx - side / 2, cy - side / 2, cz - side / 2
    ]
}

/**
 * Creates a new array that repeats a sequence a number of times.
 * @param {Array<T>} values Sequence of values to repeat
 * @param {Number} count Number of times to repeat the value
 * @returns {Array<T>}
 * @template T
 */
function repeat(values, count) {
    return Array.from({length: count * values.length}, 
        (_, i) => values[i % values.length]);
}

/**
 * Maps the coordinates of the ith element of a two-dimensional array into the
 * index of a one-dimensional array.
 * @param {Number} x X-coordinate
 * @param {Number} y Y-coordinate
 * @param {Number} w Width of the two-dimensional coordinate system
 * @param {Number} c Number of elements per "block" of data
 * @param {Number} i Index of the element inside the data block
 */
const flatIndex = (w, c, x, y, i) => (y * w + x) * c + i

/**
 * A light grid
 */
class LightGridObject extends SceneObject {
    /**
     * Create a new light grid
     * @param {String} name Name of the object
     * @param {Number} width Number of segments across the horizontal
     * @param {Number} height Number of segments across the vertical
     * @param {Number} unit Size of each segment
     * @param {Array<Number>} color Color of the grid
     * @param {Number} thickness Thickness of each line
     */
    constructor (name, {width, height, unit = 1, color, thickness = 1}) {
        super(name);
        this.width = width;
        this.height = height;
        this.unit = unit;
        this.vbuf = gl.createBuffer();
        this.gbuf = gl.createBuffer();
        this.ibuf = gl.createBuffer();
        this.color = color;
        this.thickness = thickness;

        this.shader = "grid";
        this.genBuffers();
    }

    set shader(id) {
        this.shaderId = id;
        this.shaderProg = PROGRAMS[id].glref;

        this.uProj = findUniform(this.shaderId, "proj");
        this.uWorld = findUniform(this.shaderId, "world");
        this.uTrans = findUniform(this.shaderId, "transform");
        this.uColor = findUniform(this.shaderId, "color");
        this.attrVert = gl.getAttribLocation(this.shaderProg, "vertex");
    }

    /**
     * Fills the vertex buffers
     */
    genVertices() {
        // 4 vertices per segment
        const vertices = new Float32Array(this.height * this.width * 8 * 3);
        const gridPositions = new Float32Array(this.height * this.width * 8 * 2);

        const vidx = flatIndex.bind(this, this.width, 8 * 3);
        const gidx = flatIndex.bind(this, this.width, 8 * 2);

        const MID_X = this.width / 2;
        const MID_Y = this.height / 2;
        // Horizontal segments
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                // Construct this intersection block
                const block = cube(
                    (x - MID_X) * this.unit, 
                    (y - MID_Y) * this.unit, 
                    0, 
                    this.thickness
                );
                block.forEach((v, i) => {
                    vertices[vidx(x, y, i)] = v
                });

                const positions = repeat([x / this.width, y / this.height], 8);
                positions.forEach((v, i) => gridPositions[gidx(x, y, i)] = v);
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gbuf);
        gl.bufferData(gl.ARRAY_BUFFER, gridPositions, gl.STATIC_DRAW);
    }

    /**
     * Generate the element buffer
     */
    genElements() {
        // There are (width - 1) horizontal line segments, and (height - 1)
        // vertical line segments. Each line segment takes two points.
        const eArr = [];
        const idx = flatIndex.bind(this, this.width, 8);

        // Generate intersections
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                // 0bXYZ
                // 1 = negative, 0 = positive
                eArr.push(
                    idx(x, y, 0b110), idx(x, y, 0b000), idx(x, y, 0b100),
                    idx(x, y, 0b000), idx(x, y, 0b110), idx(x, y, 0b010)
                );
                eArr.push(
                    idx(x, y, 0b111), idx(x, y, 0b101), idx(x, y, 0b001),
                    idx(x, y, 0b001), idx(x, y, 0b011), idx(x, y, 0b111)
                );
            }
        }

        // Generate grid lines
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                if (x < this.width - 1) {
                    eArr.push(
                        idx(x, y, 0b000), idx(x, y, 0b010), idx(x + 1, y, 0b100),
                        idx(x, y, 0b010), idx(x + 1, y, 0b110), idx(x + 1, y, 0b100)
                    );
                    eArr.push(
                        idx(x, y, 0b001), idx(x + 1, y, 0b101), idx(x, y, 0b011),
                        idx(x, y, 0b011), idx(x + 1, y, 0b101), idx(x + 1, y, 0b111)
                    );
                    eArr.push(
                        idx(x, y, 0b000), idx(x + 1, y, 0b100), idx(x, y, 0b001),
                        idx(x, y, 0b001), idx(x + 1, y, 0b100), idx(x + 1, y, 0b101)
                    );
                    eArr.push(
                        idx(x, y, 0b010), idx(x, y, 0b011), idx(x + 1, y, 0b110), 
                        idx(x, y, 0b011), idx(x + 1, y, 0b111), idx(x + 1, y, 0b110)
                    );
                }

                if (y < this.height - 1) {
                    eArr.push(
                        idx(x, y, 0b100), idx(x, y, 0b000), idx(x, y + 1, 0b010),
                        idx(x, y, 0b100), idx(x, y + 1, 0b010), idx(x, y + 1, 0b110)
                    );
                    eArr.push(
                        idx(x, y, 0b101), idx(x, y + 1, 0b011), idx(x, y, 0b001),
                        idx(x, y, 0b101), idx(x, y + 1, 0b111), idx(x, y + 1, 0b011)
                    );
                    eArr.push(
                        idx(x, y, 0b000), idx(x, y, 0b001), idx(x, y + 1, 0b010),
                        idx(x, y, 0b001), idx(x, y + 1, 0b011), idx(x, y + 1, 0b010)
                    );
                    eArr.push(
                        idx(x, y, 0b100), idx(x, y + 1, 0b110), idx(x, y, 0b101),
                        idx(x, y, 0b101), idx(x, y + 1, 0b110), idx(x, y + 1, 0b111)
                    );
                }
            }
        }

        const elements = new Uint16Array(eArr);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elements, gl.STATIC_DRAW);
    }

    /**
     * Generate all of the buffers
     */
    genBuffers() {
        this.genVertices();
        this.genElements();
    }

    /**
     * Gets the number of triangles in this grid
     * @returns {Number}
     */
    get triangles() {
        return (this.width * this.height * 2) * 2 +
            ((this.width - 1) * this.height * 2) * 4 +
            (this.width * (this.height - 1) * 2) * 4;
    }

    /**
     * Render the mesh
     * @param {Number} now Application time in seconds
     * @param {mat4} proj Camera projection matrix
     * @param {mat4} world Camera world matrix
     * @param {mat4} transform Model transform matrix
     */
    render(now, proj, world, transform) {
        gl.useProgram(this.shaderProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuf);
        gl.vertexAttribPointer(this.attrVert, 3, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix4fv(this.uProj, false, proj);
        gl.uniformMatrix4fv(this.uWorld, false, world);
        gl.uniformMatrix4fv(this.uTrans, false, transform);
        gl.uniform4fv(this.uColor, this.color);
        gl.drawElements(gl.TRIANGLES, this.triangles * 3, gl.UNSIGNED_SHORT, 0);
    }
}
