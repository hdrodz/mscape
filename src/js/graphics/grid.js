"use strict";

//
// grid.js -- Light grid scene object
//

class LightGridObject extends SceneObject {
    constructor (name, {width, height, unit = 1, color}) {
        super(name);
        this.width = width;
        this.height = height;
        this.unit = unit;
        this.vbuf = gl.createBuffer();
        this.ibuf = gl.createBuffer();
        this.color = color;

        this.shader = "grid";

        this.genBuffers();
    }

    set shader(id) {
        this.shaderId = id;
        this.shaderProg = PROGRAMS[id].glref;
        this.uTrans = findUniform(this.shaderId, "transform");
        this.uColor = findUniform(this.shaderId, "color");
        this.attrVert = gl.getAttribLocation(this.shaderProg, "vertex");
    }

    genBuffers() {
        // 4 vertices per segment
        const vertices = new Float32Array(this.height * this.width * 4);
        // Horizontal segments
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                vertices[(y * this.width + x) * 2] = x * this.unit;
                vertices[(y * this.width + x) * 2 + 1] = y * this.unit;
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // There are (width - 1) horizontal line segments, and (height - 1)
        // vertical line segments. Each line segment takes two points.
        const elements = new Uint16Array((this.width) * (this.height) * 4);
        let i = 0;
        for (let y = 0; y < this.height - 1; ++y) {
            for (let x = 0; x < this.width - 1; ++x) {
                elements[i++] = y * this.width + x;
                elements[i++] = y * this.width + x + 1;
                elements[i++] = y * this.width + x;
                elements[i++] = (y + 1) * this.width + x;
            }
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elements, gl.STATIC_DRAW);
    }

    render(now, transform) {
        gl.useProgram(this.shaderProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuf);
        gl.vertexAttribPointer(this.attrVert, 2, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix4fv(this.uTrans, false, transform);
        gl.uniform4fv(this.uColor, this.color);
        gl.drawElements(gl.LINES, (this.width) * (this.height) * 4, gl.UNSIGNED_SHORT, 0);
    }
}
