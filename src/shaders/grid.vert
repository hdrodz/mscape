
attribute vec3 vertex;
attribute vec2 gpos;

uniform mat4 proj;
uniform mat4 world;
uniform mat4 transform;

uniform sampler2D bass;
uniform float half_width;

varying float z;
varying vec2 grid_position;

void main() {
    grid_position = gpos;
    grid_position.x = abs(grid_position.x - 0.5) * 2.;// - 0.0625;
    float intensity = texture2D(bass, grid_position.xy).r * 15.;
    gl_Position = proj * world * transform * vec4(vertex + vec3(0., 0., intensity), 1.);
    z = gl_Position.z;

}
