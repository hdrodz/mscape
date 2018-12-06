
precision mediump float;

uniform vec4 color;

varying float z;
varying vec2 grid_position;

void main() {
    gl_FragColor = color;
}
