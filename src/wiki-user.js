
import { html, addPrefetch, getSourceSetFromCommonsUrl } from './common.js';
import WikiElement from './wiki-element.js';
import LazyLoadMixin from './mixins/LazyLoadMixin.js';

const styleURL = new URL('./wiki-user.css', import.meta.url)

class WikiUser extends LazyLoadMixin(WikiElement) {
    constructor() {
        super();
    }

    static get template() {
        return html`
        <div class="wiki-user">
        <img class="avatar" alt="User avatar" loading="lazy" src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/220px-Wikipedia-logo-v2.svg.webp"/>

        <span class="user-label">Wikipedia User</span>
        <h1 class="username">Wiki User</h1>
        <div class="editcount-wrapper"><span class="editcount"></span></span>Edits</div>
        <div  class="registration-wrapper">Since<span class="registration"><span></div>
        <style>
            @import url(${styleURL});
        </style>
        </div>
       `
    }


    static get properties() {
        return {
            username: {
                type: String
            },
            avatar: {
                type: String
            },
        }
    }

    connectedCallback() {
        super.connectedCallback();
        addPrefetch('preconnect', 'https://en.wikipedia.org');
    }

    async render() {
        if (!this.username) return;
        this.shadowRoot.querySelector('.username').textContent = this.username;

        if (this.avatar) {
            this.shadowRoot.querySelector('img.avatar').src = this.avatar;
        }

        try {
            const userData = await this.fetchUserData(this.username);
            this.updateUser(userData);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    async fetchUserData() {
        if (!this.username) return;
        const url = `https://en.wikipedia.org/w/api.php?action=query&list=users&ususers=${this.username}&usprop=groups|editcount|gender|registration&format=json&origin=*`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            return data.query.users[0];
        } catch (error) {
            this.shadowRoot.querySelector('.description').innerText = 'Failed to load article.';
            console.error('Fetch error:', error);
        }
    }


    updateUser(userData) {
        this.shadowRoot.querySelector('.username').textContent = userData.name;
        this.shadowRoot.querySelector('.editcount').textContent = userData.editcount;
        const registrationDate = new Date(userData.registration);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = registrationDate.toLocaleDateString(undefined, options);
        this.shadowRoot.querySelector('.registration').textContent = formattedDate;


    }
}

if (!customElements.get('wiki-user')) {
    customElements.define('wiki-user', WikiUser);
}
