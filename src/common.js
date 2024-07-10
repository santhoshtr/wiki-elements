/**
* Add a <link rel={preload | preconnect} ...> to the head
*/
function addPrefetch(kind, url, as) {
    if ( document.querySelector(`link[rel="${kind}"][href="${url}"]`)) {
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

const addScript = async src => new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.addEventListener('load', resolve);
    el.addEventListener('error', reject);
    document.body.append(el);
});

export { addPrefetch, deIndent,addScript };