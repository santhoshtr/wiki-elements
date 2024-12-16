import { addPrefetch, html } from './common.js'
import WikiElement from './wiki-element.js'

/**
 * Fetches language names and their autonyms from Wikipedia API.
 * @returns {Promise<Object<string, {autonym: string, name: string}>>} A promise that resolves to an object where keys are language codes and values are objects containing autonym and name.
 */
async function getLanguageNames() {
    return await fetch(
        'https://en.wikipedia.org/w/api.php?action=query&liprop=autonym|name&meta=languageinfo&uselang=en&format=json&origin=*'
    )
        .then((response) => response.json())
        .then((queryResult) => queryResult.query.languageinfo)
}

class WikiLanguageSelector extends WikiElement {
    /**
     * Constructs a new instance of the class.
     * Initializes various properties and elements related to the language selector.
     *
     * @constructor
     * @property {HTMLElement} wrapper - The wrapper div element.
     * @property {HTMLElement} input - The input element for language search.
     * @property {HTMLElement} suggestionsListElement - The element containing the list of suggestions.
     * @property {HTMLElement} suggestionsPopover - The popover element for suggestions.
     * @property {Object<string, {autonym: string, name: string}>} languages - Object containing language details.
     * @property {Array<string>} languageList - Array of language codes.
     * @property {string|null} selectedValue - The currently selected language value.
     * @property {Array<string>} suggestions - Array of language codes for suggestions.
     * @property {number} activeSuggestionIndex - Index of the currently active suggestion.
     */
    constructor() {
        super()
        this.wrapper = this.shadowRoot.querySelector('div')
        this.input = this.shadowRoot.getElementById('wikilanguageselector-search')
        this.suggestionsListElement = this.shadowRoot.querySelector('.suggestions')
        this.suggestionsPopover = this.shadowRoot.querySelector('.suggestions-popover')
        this.languages = {}
        // Array of language codes
        this.languageList = []
        this.selectedValue = null
        // Array of language codes
        this.suggestions = []
        this.activeSuggestionIndex = -1
    }

    static get template() {
        return html`
            <form>
                <input id="wikilanguageselector-search" type="search" part="input" autocomplete="off" />
            </form>
            <div class="suggestions-popover" popover>
                <ul part="suggestions" class="suggestions"></ul>
            </div>
        `
    }

    static get stylesheetURL() {
        return new URL('./wiki-language-selector.css', import.meta.url)
    }

    static get properties() {
        return {
            'data-language-list': {
                type: Array,
            },
            'data-languages': {
                type: Object,
            },
            onselect: {
                type: Function,
            },
        }
    }

    async connectedCallback() {
        super.connectedCallback()
        addPrefetch('preconnect', 'https://en.wikipedia.org')
        this.listen()

        this.languages = this['data-languages'] || (await getLanguageNames())
        this.languageList = this['data-language-list']
        if (this.languageList) {
            this.languages = this.languages.filter((lang) => this.languageList.includes(lang.value))
        }
        this.render()
    }

    listen() {
        this.input.addEventListener('input', () => this.onInput())
        this.input.addEventListener('keydown', (e) => this.onKeyDown(e))
        window.addEventListener('resize', () => this.positionMenu())
    }

    onInput() {
        const searchQuery = this.input.value
        this.suggestions = this.getSuggestions(searchQuery)
        this.updateMenu()
    }

    getSuggestions(searchQuery) {
        if (searchQuery === '') {
            return Object.keys(this.languages)
        }

        if (this.languages[searchQuery]) {
            return [searchQuery]
        }

        const searchQueryLower = searchQuery.toLowerCase()
        return Object.keys(this.languages).filter((langCode) => {
            const language = this.languages[langCode]
            return (
                language.name.toLowerCase().includes(searchQueryLower) ||
                language.autonym.toLowerCase().includes(searchQueryLower)
            )
        })
    }

    render() {
        this.suggestionsListElement.innerHTML = ''
        let languageCodes = Object.keys(this.languages)

        languageCodes.forEach((langCode, index) => {
            const language = this.languages[langCode]
            const li = document.createElement('li')
            li.setAttribute('part', 'suggestion')
            li.classList.add('suggestion')
            li.textContent = language.name
            li.setAttribute('id', langCode)
            li.tabIndex = 0
            li.addEventListener('click', () => this.selectSuggestion(langCode))
            li.addEventListener('mouseover', () => this.setActiveSuggestion(index))
            this.suggestionsListElement.appendChild(li)
        })

        this.positionMenu()
    }

    updateMenu() {
        this.suggestionsListElement.querySelectorAll('li').forEach((li) => {
            let langCode = li.getAttribute('id')
            // li.classList.remove('active')
            li.classList.remove('hidden')
            if (!this.suggestions.includes(langCode)) {
                li.classList.add('hidden')
            }
        })
        if (this.suggestions.length > 0) {
            this.suggestionsPopover.showPopover()
        }
        this.activeSuggestionIndex = -1
    }

    positionMenu() {
        if ('anchorName' in document.documentElement.style) {
            // We will handle positioning with CSS
            return
        }
        Object.assign(this.suggestionsPopover.style, {
            left: `${this.input.offsetLeft}px`,
            top: `${this.input.offsetTop + this.input.offsetHeight}px`,
        })
    }

    onKeyDown(e) {
        switch (e.key) {
            case 'ArrowDown':
                this.activeSuggestionIndex = (this.activeSuggestionIndex + 1) % this.suggestions.length
                this.highlightActiveSuggestion()
                break
            case 'ArrowUp':
                this.activeSuggestionIndex =
                    (this.activeSuggestionIndex - 1 + this.suggestions.length) % this.suggestions.length
                this.highlightActiveSuggestion()
                break
            case 'Enter':
                this.selectSuggestion(this.suggestions[this.activeSuggestionIndex])
                break
            case 'Escape':
                this.suggestionsPopover.hidePopover()
                break
        }
    }

    highlightActiveSuggestion() {
        let index = 0
        Array.from(this.suggestionsListElement.children).forEach((li) => {
            li.classList.remove('active')
            if (li.classList.contains('hidden')) {
                return
            }

            if (index === this.activeSuggestionIndex) {
                li.classList.add('active')
                li.setAttribute('part', 'active-suggestion')
            }
            index += 1
        })
    }

    setActiveSuggestion(index) {
        this.activeSuggestionIndex = index
        this.highlightActiveSuggestion()
    }

    selectSuggestion(suggestion) {
        const selectedLanguage = this.languages[suggestion]
        this.input.value = selectedLanguage.name
        this.suggestionsPopover.hidePopover()
        this.selectedValue = suggestion
        this.dispatchEvent(
            new CustomEvent('select', {
                value: suggestion,
                name: selectedLanguage.name,
                autonym: selectedLanguage.autonym,
            })
        )
        if (this.onselect) {
            this.onselect({
                value: suggestion,
                name: selectedLanguage.name,
                autonym: selectedLanguage.autonym,
            })
        }
    }
}

if (!customElements.get('wiki-language-selector')) {
    customElements.define('wiki-language-selector', WikiLanguageSelector)
}

// const autoinput = document.querySelector('autocomplete-input')

// autoinput.addEventListener('select', (value) => {
//     console.log(value)
// })
