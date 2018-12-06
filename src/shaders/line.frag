precision mediump float;

varying vec2 position_norm;

uniform sampler2D tex;

void main() {
    float v = texture2D(tex, position_norm).r;

    float d = 1. - abs(v - position_norm.y + 0.25);
    d *= d;
    d *= d;
    d *= d;
    d *= d;
    d *= d;
    gl_FragColor = vec4(0., d, d, 1.);
}
