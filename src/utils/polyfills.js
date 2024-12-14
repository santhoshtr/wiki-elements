// https://web.dev/articles/declarative-shadow-dom
// Polyfill for declarative Shadow DOM
;(function attachShadowRoots(root) {
    function supportsDeclarativeShadowDOM() {
        return Object.prototype.hasOwnProperty.call(HTMLTemplateElement.prototype, 'shadowRootMode')
    }

    if (supportsDeclarativeShadowDOM()) {
        // Declarative Shadow DOM is supported, no need to polyfill.
        return
    }
    root.querySelectorAll('template[shadowrootmode]').forEach((template) => {
        const mode = template.getAttribute('shadowrootmode')
        const shadowRoot = template.parentNode.attachShadow({ mode })

        shadowRoot.appendChild(template.content)
        template.remove()
        attachShadowRoots(shadowRoot)
    })
})(document)
