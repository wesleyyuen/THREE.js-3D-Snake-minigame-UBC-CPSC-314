#version 300 es

out vec3 vcsTexcoord;

void main() {
	mat4 T = mat4(1.0);
	vcsTexcoord = (modelMatrix * vec4(position, 1.0)).xyz;
	gl_Position = projectionMatrix * modelViewMatrix * (vec4(position, 1.0) + vec4(cameraPosition, 0.0));
}