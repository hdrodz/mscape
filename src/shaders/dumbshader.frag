precision mediump float;

varying vec2 T;
varying vec3 N;

uniform sampler2D tex;

void main() {
    gl_FragColor = texture2D(tex, vec2(T.s, 1. - T.t));
}
