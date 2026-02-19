function generateTableOfContents() {
	const toc = document.createElement("section");
	toc.id = "toc";
	toc.classList.add("article-nav");

	// Find all h4 and h5 elements inside the article
	const headings = document.querySelectorAll("article h4, article h5");
	const stack = [];
	let lastLevel = 2;
	let lastList = toc;
	for (const heading of headings) {
		const level = Number.parseInt(heading.tagName[1]);
		const li = document.createElement("li");
		const a = document.createElement("a");
		a.href = `#${heading.id}`;
		a.textContent = heading.textContent;
		li.append(a);
		if (level === lastLevel) {
			lastList.append(li);
		} else if (level > lastLevel) {
			const newList = document.createElement("ul");
			newList.append(li);
			lastList.append(newList);
			stack.push(lastList);
			lastList = newList;
		} else {
			while (level < lastLevel) {
				stack.pop();
				lastList = stack[stack.length - 1];
				lastLevel--;
			}
			lastList.append(li);
		}
		lastLevel = level;
	}

	// Append TOC to the active nav item
	const activeNavItem = document.querySelector('.nav a[aria-current="page"]');
	if (activeNavItem) {
		activeNavItem.append(toc);
	}
}

function init() {
	if (
		HTMLScriptElement.supports &&
		HTMLScriptElement.supports("speculationrules")
	) {
		const specScript = document.createElement("script");
		specScript.type = "speculationrules";
		const specRules = {
			prerender: [
				{
					where: {
						href_matches: "/doc/*",
					},
					eagerness: "immediate",
				},
			],
		};
		specScript.textContent = JSON.stringify(specRules);
		document.body.append(specScript);
	}
	generateTableOfContents();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener(
	"hashchange",
	() => {
		// uncheck the menu toggle
		document.getElementById("menu-toggle").checked = false;
	},
	false,
);
