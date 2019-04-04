#version 300 es

out vec3 vcsNormal;
out vec3 vcsPosition;
out vec3 TexCoords;

void main() {
	// viewing coordinate system
	TexCoords = position;
	vcsNormal = normalMatrix * normal;
	vcsPosition = vec3(modelViewMatrix * vec4(position, 1.0));

	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
