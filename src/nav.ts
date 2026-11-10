export interface DocLink {
	id: string;
	label: string;
}

export interface DocGroup {
	label: string;
	items: DocLink[];
}

export const groups: DocGroup[] = [
	{
		label: "Start",
		items: [
			{ id: "index", label: "Overview" },
			{ id: "install", label: "Install" },
			{ id: "first-effect", label: "Your first effect" },
		],
	},
	{
		label: "API",
		items: [
			{ id: "lifecycle", label: "Lifecycle" },
			{ id: "environment", label: "Environment" },
			{ id: "surfaces", label: "Surfaces" },
			{ id: "particles", label: "Particles" },
			{ id: "rendering", label: "Rendering" },
			{ id: "configuration", label: "Configuration" },
			{ id: "performance", label: "Performance" },
			{ id: "debugging", label: "Debugging" },
		],
	},
];

export const pages: DocLink[] = groups.flatMap((group) => group.items);

export function pageHref(id: string): string {
	const base = import.meta.env.BASE_URL;
	const root = base.endsWith("/") ? base : `${base}/`;
	return id === "index" ? root : `${root}${id}/`;
}

export function groupFor(id: string): DocGroup | undefined {
	return groups.find((group) => group.items.some((item) => item.id === id));
}
