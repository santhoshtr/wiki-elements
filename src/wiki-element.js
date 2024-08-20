class WikiElement extends HTMLElement {

    constructor() {
        super();
        this.internals = this.attachInternals();
        this.connected = false;
        this.rendered = false;
        this.initializeProperties();

        this.attachShadow({ mode: 'open' });
        if (this.constructor.template) {
            this.shadowRoot.innerHTML = this.constructor.template.innerHTML;
        }
    }

    initializeProperties() {
        const props = this.constructor.properties;
        for (const [name, config] of Object.entries(props)) {
            if (!this.hasOwnProperty(name)) {
                const value = this.getAttribute(name) || config.default;
                if (config.options && !config.options.includes(value)) {
                    console.warn(`Invalid value ${value} for property ${name}. Valid options are ${config.options}`);
                    continue;
                }
                this[name] = this.convertValue(value, config.type);
            }
        }
    }

    convertValue(value, type) {
        if (value === null) { return value };
        switch (type) {
            case String:
                return value;
            case Number:
                return Number(value);
            case Boolean:
                return value !== null && value !== 'false';
            case Array:
            case Object:
                return JSON.parse(value);
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
        if (!this.rendered) { return; }
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
        return Object.keys(this.properties);
    }

    static get template() {
        return '';
        // return html`<p>${this.greeting}</p>`;
    }



    static get properties() {
        return {};
    }



}

export default WikiElement;