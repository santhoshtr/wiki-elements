class WikiElement extends HTMLElement {

    constructor() {
        super();
        this.internals = this.attachInternals();

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
        const hasChanges = false;
        if (oldValue !== newValue) {
            const props = this.constructor.properties;
            if (name in props) {
                this[name] = this.convertValue(newValue, props[name].type);
                this.propertyChangedCallback(name, oldValue, this[name]);
            }
        }
        if (hasChanges) {
            this.render();
        }
    }

    propertyChangedCallback(name, oldValue, newValue) {
        // This method can be overridden in subclasses to react to property changes
    }

    connectedCallback() {

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