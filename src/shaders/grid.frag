
precision mediump float;

uniform vec4 color;

varying float z;
varying vec2 grid_position;

void main() {
    float factor = min(grid_position.y + 0.75, 1.);
    factor *= factor;
    factor *= factor;
    factor *= factor;
    factor *= factor;
    gl_FragColor = color * factor;
}
