const LazyLoadMixin = (superClass) =>
	class extends superClass {
		constructor() {
			super();
			this._isRendered = false;
			this._observer = null;
		}

		connectedCallback() {
			this.connected = true;
			this._setupIntersectionObserver();
		}

		disconnectedCallback() {
			if (super.disconnectedCallback) {
				super.disconnectedCallback();
			}
			this._teardownIntersectionObserver();
		}

		handleIntersection(entries) {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					this.render();
					this.rendered = true;
					this._teardownIntersectionObserver();
				}
			}
		}

		_setupIntersectionObserver() {
			const options = {
				root: null,
				rootMargin: "200px",
				threshold: 0.1,
			};

			this._observer = new IntersectionObserver(
				this.handleIntersection.bind(this),
				options,
			);

			this._observer.observe(this);
		}

		_teardownIntersectionObserver() {
			if (this._observer) {
				this._observer.unobserve(this);
				this._observer.disconnect();
				this._observer = null;
			}
		}

		render() {
			// This method should be overridden in the component class
			console.warn("Render method not implemented");
			this._isRendered = true;
		}
	};

export default LazyLoadMixin;
