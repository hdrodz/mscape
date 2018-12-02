precision mediump float;

varying vec2 T;
varying vec3 N;

void main() {
    gl_FragColor = vec4(N, 1.);
}
