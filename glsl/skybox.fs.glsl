#version 300 es

in vec3 vcsTexcoord;
out vec4 out_FragColor;

uniform samplerCube skyboxTexture;

void main() {
	out_FragColor = texture(skyboxTexture, vcsTexcoord);
}