
attribute vec3 vertex;
attribute vec2 gpos;

uniform mat4 proj;
uniform mat4 world;
uniform mat4 transform;

varying float z;
varying vec2 grid_position;

void main() {
    gl_Position = proj * world* transform * vec4(vertex, 1.);
    z = gl_Position.z;
    grid_position = floor(gpos);
}
