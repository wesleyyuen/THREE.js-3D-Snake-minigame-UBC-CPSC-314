#version 300 es

out vec4 out_FragColor;

in vec3 vcsNormal;
in vec3 vcsPosition;
in vec3 TexCoords;

uniform mat4 worldMatrix;
uniform samplerCube skyboxTexture;


void main( void ) {
  vec3 N = normalize(vcsNormal);
  vec3 P = normalize(vcsPosition);
  vec4 R = inverse(worldMatrix) * vec4(reflect(P, N), 0.0);

  out_FragColor = texture(skyboxTexture, vec3(R));
}
