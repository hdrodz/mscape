
attribute vec3 vertex;

uniform mat4 transform;

varying float z;

void main() {
    gl_Position = transform * vec4(vertex, 1.);
    z = gl_Position.z;
}
