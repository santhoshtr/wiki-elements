import "./utils/polyfills.js";

export default class WikiElement extends HTMLElement {
	constructor() {
		super();
		const supportsDeclarative = Object.hasOwn(
			HTMLElement.prototype,
			"attachInternals",
		);

		this.internals = supportsDeclarative ? this.attachInternals() : undefined;
		this.connected = false;
		this.rendered = false;
		this.initializeProperties();
		// check for a Declarative Shadow Root.
		const shadow = this.internals?.shadowRoot;
		if (!shadow) {
			this.attachShadow({ mode: "open" });
			if (this.constructor.template) {
				this.shadowRoot.setHTMLUnsafe(this.constructor.template.innerHTML);
			}
		}
		if (this.constructor.stylesheetURL) {
			const link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = this.constructor.stylesheetURL;
			this.shadowRoot.appendChild(link);
		}
	}

	initializeProperties() {
		const props = this.constructor.properties;
		for (const [name, config] of Object.entries(props)) {
			if (!Object.hasOwn(this, name)) {
				const value = this.getAttribute(name) || config.default;
				if (config.options && !config.options.includes(value)) {
					console.warn(
						`Invalid value ${value} for property ${name}. Valid options are ${config.options}`,
					);
					continue;
				}
				this[name] = this.convertValue(value, config.type);
			}
		}
	}

	convertValue(value, type) {
		if (value === null) {
			return value;
		}
		switch (type) {
			case String:
				return value;
			case Number:
				return Number(value);
			case Boolean:
				return value !== null && value !== "false";
			case Array:
			case Object:
				if (typeof value === "string") {
					return JSON.parse(decodeURIComponent(value));
				}
				return value;

			default:
				return value;
		}
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue) {
			const props = this.constructor.properties;
			if (name in props) {
				this[name] = this.convertValue(newValue, props[name].type);
				this.propertyChangedCallback(name, oldValue, this[name]);
			}
		}
	}

	propertyChangedCallback(name, oldValue, newValue) {
		if (!this.rendered) {
			return;
		}
		console.log(`Property ${name} changed from ${oldValue} to ${newValue}`);
		// This method can be overridden in subclasses to react to property changes
		this.render();
	}

	connectedCallback() {
		this.connected = true;
		this.render();
		this.rendered = true;
	}

	static get observedAttributes() {
		return Object.keys(WikiElement.properties);
	}

	static get template() {
		return "";
		// return html`<p>${this.greeting}</p>`;
	}

	static get properties() {
		return {};
	}
}

WikiElement;
