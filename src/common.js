/**
* Add a <link rel={preload | preconnect} ...> to the head
*/
function addPrefetch(kind, url, as) {
    if (document.querySelector(`link[rel="${kind}"][href="${url}"]`)) {
        return; // Link already exists, no need to add it again
    }

    const linkEl = document.createElement('link');
    linkEl.rel = kind;
    linkEl.href = url;
    if (as) {
        linkEl.as = as;
    }
    document.head.append(linkEl);
}

/**
 * Removes the common indentation from a block of text.
 * @param {string} text - The text to de-indent.
 * @returns {string} - The de-indented text.
 */
function deIndent(text) {
    let indent = text.match(/^[\r\n]*([\t ]+)/);

    if (indent) {
        indent = indent[1];

        text = text.replace(RegExp("^" + indent, "gm"), "");
    }

    return text;
}

/**
 * Adds a script to the document dynamically.
 * @param {string} src - The source URL of the script to be added.
 * @returns {Promise<void>} - A promise that resolves when the script is loaded successfully, or rejects if there is an error.
 */
const addScript = async src => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return; // Script already exists, no need to add it again
    }

    const el = document.createElement('script');
    el.src = src;
    el.crossorigin="";
    el.addEventListener('load', resolve);
    el.addEventListener('error', reject);
    document.body.append(el);
});

/**
 * Adds a stylesheet to the document dynamically.
 *
 * @param {string} src - The URL of the stylesheet to be added.
 * @returns {Promise<void>} A promise that resolves when the stylesheet is loaded successfully, or rejects if there was an error.
 */
const addStyle = async src => new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${src}"]`)) {
        resolve();
        return; // Style already exists, no need to add it again
    }

    const el = document.createElement('link');
    el.rel = 'stylesheet';
    el.href = src;
    el.crossorigin="";
    el.addEventListener('load', resolve);
    el.addEventListener('error', reject);
    document.head.append(el);
});

export { addPrefetch, deIndent, addScript, addStyle };