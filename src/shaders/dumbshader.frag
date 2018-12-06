precision mediump float;

varying vec2 T;
varying vec3 N;

uniform vec3 u_reverseLightDirection;
uniform sampler2D tex;

void main() {
    gl_FragColor = texture2D(tex, vec2(T.s, 1. - T.t));

    float light = dot(normalize(N), normalize(vec3(1,2,-1)));
    gl_FragColor.rgb *= light;
}
