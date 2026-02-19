// https://web.dev/articles/declarative-shadow-dom
// Polyfill for declarative Shadow DOM
(function attachShadowRoots(root) {
	function supportsDeclarativeShadowDOM() {
		return Object.hasOwn(HTMLTemplateElement.prototype, "shadowRootMode");
	}

	if (supportsDeclarativeShadowDOM()) {
		// Declarative Shadow DOM is supported, no need to polyfill.
		return;
	}

	for (const template of root.querySelectorAll("template[shadowrootmode]")) {
		const mode = template.getAttribute("shadowrootmode");
		const shadowRoot = template.parentNode.attachShadow({ mode });

		shadowRoot.appendChild(template.content);
		template.remove();
		attachShadowRoots(shadowRoot);
	}
})(document);
