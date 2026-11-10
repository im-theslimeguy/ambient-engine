const canvas = document.querySelector("[data-pixel-canvas]");
const debugButton = document.querySelector("[data-grid-debug]");

function setDebug(on) {
	canvas?.classList.toggle("pixel-grid-debug", on);
	if (debugButton) {
		debugButton.dataset.on = on ? "true" : "false";
		debugButton.className = on
			? "pixel-button font-block font-bold inline-flex items-center justify-center pixel-border pixel-pressable cursor-pointer bg-emerald-400 text-zinc-950 border-emerald-300 pixel-shadow ml-2"
			: "pixel-button font-block font-bold inline-flex items-center justify-center pixel-border pixel-pressable cursor-pointer bg-zinc-800 text-zinc-100 border-zinc-700 pixel-shadow ml-2";
		debugButton.textContent = `GRID DEBUG: ${on ? "ON" : "OFF"} [P]`;
	}
}

debugButton?.addEventListener("click", () => {
	setDebug(debugButton.dataset.on !== "true");
});

window.addEventListener("keydown", (event) => {
	const target = event.target;
	const editable =
		target instanceof HTMLElement &&
		(target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
	if (event.key.toLowerCase() === "p" && !editable) {
		event.preventDefault();
		setDebug(debugButton?.dataset.on !== "true");
	}
});

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
	const context = blast.getContext("2d");
	const paint = () => {
		const rect = blast.getBoundingClientRect();
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		blast.width = Math.floor(rect.width * dpr);
		blast.height = Math.floor(rect.height * dpr);
		if (!context) return;
		context.setTransform(dpr, 0, 0, dpr, 0, 0);
		context.clearRect(0, 0, rect.width, rect.height);
		context.fillStyle = "#444444";
		const cell = 3;
		for (let y = 0; y < rect.height; y += cell) {
			for (let x = 0; x < rect.width; x += cell) {
				const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
				if (n - Math.floor(n) > 0.82) context.fillRect(x, y, 1, 1);
			}
		}
	};
	paint();
	window.addEventListener("resize", paint);
}
