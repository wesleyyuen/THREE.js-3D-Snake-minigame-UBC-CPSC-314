#version 300 es

out float intensity;
out vec3 vcsNormal;
out vec3 vcsPosition;
out vec3 TexCoords;

uniform vec3 lightPosition;
uniform vec3 coinPosition;
uniform float angle;

void main() {
    TexCoords = position;
	vcsNormal = normalMatrix * normal;
	vcsPosition = vec3(modelViewMatrix * vec4(position, 1.0));

    vec4 wpos = modelMatrix * vec4(position, 1.0);
    vec3 l = lightPosition - wpos.xyz;
    intensity = dot(normalize(l), normal);

    mat4 T = mat4(1.0);
    T[3].xyz -= coinPosition;

    mat4 R = mat4(1.0);
    R[0][0] = cos(angle);
    R[0][2] = -sin(angle);
    R[2][0] = sin(angle);
    R[2][2] = cos(angle);

    gl_Position = projectionMatrix * viewMatrix * inverse(T) * R * T * wpos;
}