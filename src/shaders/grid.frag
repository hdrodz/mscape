
precision mediump float;

uniform vec4 color;

varying float z;
varying vec2 grid_position;

void main() {
    float factor = 1. - grid_position.x;
    factor *= factor;
    factor *= factor;
    factor *= factor;
    factor *= factor;
    gl_FragColor = color; //floor(color * factor);
}
