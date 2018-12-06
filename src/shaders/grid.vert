
attribute vec3 vertex;

uniform mat4 proj;
uniform mat4 world;
uniform mat4 transform;

varying float z;

void main() {
    gl_Position = proj * world* transform * vec4(vertex, 1.);
    z = gl_Position.z;
}
