class WikiElement extends HTMLElement {

    constructor() {
        super();
        this.initializeProperties();
        this.initializeState();
        this.attachShadow({ mode: 'open' });
        if (this.constructor.template) {
            this.shadowRoot.innerHTML = this.constructor.template.innerHTML;
        }
    }

    initializeState() {
        this._state = { ...this.constructor.defaultState };
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
        if (value === null) return value;
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
        // This method can be overridden in subclasses to react to property changes
    }

    static get observedAttributes() {
        return Object.keys(this.properties);
    }

    static get template() {
        return '';
        // return html`<p>${this.greeting}</p>`;
    }

    static get defaultState() {
        return {
            rendered: false,
            rendering: false
        };
    }

    static get properties() {
        return {};
    }

    setState(newState) {
        const oldState = { ...this._state };
        const changedKeys = Object.keys(newState).filter(key => this._state[key] !== newState[key]);

        Object.assign(this._state, newState);

        changedKeys.forEach(key => {
            this.stateChangedCallback(key, oldState[key], this._state[key]);
        });
    }


    stateChangedCallback(key, oldValue, newValue) {
        // This method can be overridden in subclasses to react to state changes
    }

    getState(key) {
        return key ? this._state[key] : { ...this._state };
    }
}

export default WikiElement;