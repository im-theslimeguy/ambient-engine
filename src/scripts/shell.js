function copyButton() {
	const wrap = document.createElement("div");
	wrap.className = "pixel-block-button group inline-flex flex-col";
	wrap.innerHTML = `
		<span aria-hidden="true" class="h-0 group-active:h-[calc(2*var(--pixel))] transition-all duration-75 block"></span>
		<button type="button" class="flex flex-col p-0 border-1 border-black cursor-pointer select-none outline-1 outline-transparent group-hover:outline-white">
			<span class="pixel-block-button__face relative z-10 font-block border-1 block py-1 px-3 bg-[#D1D2D4] border-white/60 text-black">Copy</span>
			<span aria-hidden="true" class="pixel-block-button__extrusion block h-[calc(2*var(--pixel))] group-active:h-0 transition-all duration-75 bg-[#565859]"></span>
		</button>`;
	return wrap;
}

document.querySelectorAll(".doc pre").forEach((pre) => {
	const language = pre.getAttribute("data-language") || "Code";
	const card = document.createElement("div");
	card.className = "pixel-block-card border-1 border-black font-block min-w-0 flex flex-col my-5";
	const face = document.createElement("div");
	face.className = "pixel-block-card__face font-block border-1 min-w-0 p-0 bg-[#292929] border-[#404040] text-white";
	const bar = document.createElement("div");
	bar.className = "flex flex-row justify-between items-center px-4 py-2 border-b-1 border-[#404040]";
	const title = document.createElement("div");
	title.className = "font-block font-bold text-sm text-white";
	title.textContent = language;
	const button = copyButton();
	button.querySelector("button")?.addEventListener("click", async () => {
		const label = button.querySelector(".pixel-block-button__face");
		const text = pre.innerText;
		let wrote = false;
		try {
			await navigator.clipboard.writeText(text);
			wrote = true;
		} catch {
			const area = document.createElement("textarea");
			area.value = text;
			area.setAttribute("readonly", "");
			area.style.position = "fixed";
			area.style.left = "-9999px";
			document.body.append(area);
			area.select();
			wrote = document.execCommand("copy");
			area.remove();
		}
		if (label) label.textContent = wrote ? "Copied!" : "Copy";
		if (wrote) {
			window.setTimeout(() => {
				if (label) label.textContent = "Copy";
			}, 1500);
		}
	});
	bar.append(title, button);
	const body = document.createElement("div");
	body.className = "px-4 py-4 text-xs font-mono text-[#e5e5e5] overflow-x-auto";
	pre.parentNode?.insertBefore(card, pre);
	body.append(pre);
	face.append(bar, body);
	const extrusion = document.createElement("div");
	extrusion.className = "pixel-block-card__extrusion shrink-0 h-2 bg-[#222222]";
	card.append(face, extrusion);
});

const base = document.documentElement.dataset.base || "/";
if (base !== "/") {
	document.querySelectorAll('.doc a[href^="/"]').forEach((anchor) => {
		const href = anchor.getAttribute("href");
		if (href && !href.startsWith(base)) {
			anchor.setAttribute("href", base.replace(/\/$/, "") + href);
		}
	});
}

const blast = document.querySelector("[data-pixel-blast]");
if (blast instanceof HTMLCanvasElement) {
	const gl = blast.getContext("webgl2", { alpha: true, antialias: false, premultipliedAlpha: false });
	if (gl) {
		const vertex = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
		const fragment = `#version 300 es
precision highp float;
uniform vec3 uColor;
uniform vec2 uResolution;
uniform vec2 uPixelOrigin;
uniform float uTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform float uPixelJitter;
uniform float uEdgeFade;
uniform int uShapeType;
const int SHAPE_SQUARE = 0;
out vec4 fragColor;
float Bayer2(vec2 a) { a = floor(a); return fract(a.x / 2. + a.y * a.y * .75); }
#define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))
#define FBM_OCTAVES 5
#define FBM_LACUNARITY 1.25
#define FBM_GAIN 1.0
float hash11(float n){ return fract(sin(n)*43758.5453); }
float vnoise(vec3 p){
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  float n000 = hash11(dot(ip + vec3(0.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n100 = hash11(dot(ip + vec3(1.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n010 = hash11(dot(ip + vec3(0.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n110 = hash11(dot(ip + vec3(1.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n001 = hash11(dot(ip + vec3(0.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n101 = hash11(dot(ip + vec3(1.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n011 = hash11(dot(ip + vec3(0.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  float n111 = hash11(dot(ip + vec3(1.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);
  float x00 = mix(n000, n100, w.x);
  float x10 = mix(n010, n110, w.x);
  float x01 = mix(n001, n101, w.x);
  float x11 = mix(n011, n111, w.x);
  float y0 = mix(x00, x10, w.y);
  float y1 = mix(x01, x11, w.y);
  return mix(y0, y1, w.z) * 2.0 - 1.0;
}
float fbm2(vec2 uv, float t){
  vec3 p = vec3(uv * uScale, t);
  float amp = 1.0;
  float freq = 1.0;
  float sum = 1.0;
  for (int i = 0; i < FBM_OCTAVES; ++i){
    sum += amp * vnoise(p * freq);
    freq *= FBM_LACUNARITY;
    amp *= FBM_GAIN;
  }
  return sum * 0.5 + 0.5;
}
void main(){
  float pixelSize = uPixelSize;
  vec2 localFragCoord = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  vec2 fragCoord = localFragCoord + uPixelOrigin;
  float aspectRatio = uResolution.x / uResolution.y;
  vec2 pixelId = floor(fragCoord / pixelSize);
  vec2 cellPixelSize = vec2(8.0 * pixelSize);
  vec2 cellId = floor(fragCoord / cellPixelSize);
  vec2 cellCoord = cellId * cellPixelSize;
  vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);
  float base = fbm2(uv, uTime * 0.05);
  base = base * 0.5 - 0.65;
  float feed = base + (uDensity - 0.5) * 0.3;
  float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
  float bw = step(0.5, feed + bayer);
  float h = fract(sin(dot(floor(fragCoord / uPixelSize), vec2(127.1, 311.7))) * 43758.5453);
  float jitterScale = 1.0 + (h - 0.5) * uPixelJitter;
  float coverage = bw * jitterScale;
  vec3 color = uColor;
  vec3 srgbColor = mix(color * 12.92, 1.055 * pow(color, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, color));
  fragColor = vec4(srgbColor, coverage);
}`;
		const compile = (type, source) => {
			const shader = gl.createShader(type);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			return shader;
		};
		const program = gl.createProgram();
		gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
		gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
		gl.linkProgram(program);
		gl.useProgram(program);
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
		const position = gl.getAttribLocation(program, "position");
		gl.enableVertexAttribArray(position);
		gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
		const uniforms = {
			uColor: gl.getUniformLocation(program, "uColor"),
			uResolution: gl.getUniformLocation(program, "uResolution"),
			uPixelOrigin: gl.getUniformLocation(program, "uPixelOrigin"),
			uTime: gl.getUniformLocation(program, "uTime"),
			uPixelSize: gl.getUniformLocation(program, "uPixelSize"),
			uScale: gl.getUniformLocation(program, "uScale"),
			uDensity: gl.getUniformLocation(program, "uDensity"),
			uPixelJitter: gl.getUniformLocation(program, "uPixelJitter"),
			uEdgeFade: gl.getUniformLocation(program, "uEdgeFade"),
			uShapeType: gl.getUniformLocation(program, "uShapeType"),
		};
		gl.uniform3f(uniforms.uColor, 0x44 / 255, 0x44 / 255, 0x44 / 255);
		gl.uniform1f(uniforms.uScale, 3);
		gl.uniform1f(uniforms.uDensity, 1.2);
		gl.uniform1f(uniforms.uPixelJitter, 0);
		gl.uniform1f(uniforms.uEdgeFade, 0);
		gl.uniform1i(uniforms.uShapeType, 0);
		const resize = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const width = Math.floor(window.innerWidth * dpr);
			const height = Math.floor(window.innerHeight * dpr);
			blast.width = width;
			blast.height = height;
			gl.viewport(0, 0, width, height);
			gl.useProgram(program);
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.enableVertexAttribArray(position);
			gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
			gl.uniform3f(uniforms.uColor, 0x44 / 255, 0x44 / 255, 0x44 / 255);
			gl.uniform1f(uniforms.uScale, 3);
			gl.uniform1f(uniforms.uDensity, 1.2);
			gl.uniform1f(uniforms.uPixelJitter, 0);
			gl.uniform1f(uniforms.uEdgeFade, 0);
			gl.uniform1i(uniforms.uShapeType, 0);
			gl.uniform2f(uniforms.uPixelOrigin, 0, 0);
			gl.uniform2f(uniforms.uResolution, width, height);
			gl.uniform1f(uniforms.uPixelSize, 1.5 * dpr);
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			gl.uniform1f(uniforms.uTime, 8);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		};
		resize();
		window.addEventListener("resize", resize);
	}
}
