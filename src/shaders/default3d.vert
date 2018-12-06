
attribute vec3 vertex;
attribute vec3 normal;
attribute vec2 texcoord;

uniform mat4 projection;
uniform mat4 world;
uniform mat4 transform;

varying vec3 N;
varying vec2 T;

void main() {
    gl_Position = projection* world* transform * vec4(vertex, 1.);

    mat4 translate = mat4(
        0., 0., 0., 0.,
        0., 0., 0., 0.,
        0., 0., 0., 0.,
        transform[3].x, transform[3].y, transform[3].z, 0.
    );

    // Cancel the translation from the transform vector, and
    // calculate the "fixed" normal
    N = normalize(((transform - translate) * vec4(normal, 1.) ).xyz);
    T = texcoord;
}
