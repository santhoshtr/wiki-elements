import { debounce } from '../common.js';

const ResizeMixin = (superClass) => class extends superClass {
    constructor() {
        super();

        this.debouncedUpdateDimensions = debounce(this.updateDimensions.bind(this), 250);

        this.resizeObserver = new ResizeObserver(entries => {
            if (!this.rendered) {
                return
            }
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                this.debouncedUpdateDimensions(width, height);
            }
        });
    }

    connectedCallback() {
        super.connectedCallback();
        this.resizeObserver.observe(this);
    }

    disconnectedCallback() {
        if (super.disconnectedCallback) {
            super.disconnectedCallback();
        }
        this.resizeObserver.unobserve(this);
    }

    updateDimensions(width, height) {
        // This method should be overridden in the component class

    }

};

export default ResizeMixin;