/**
* Add a <link rel={preload | preconnect} ...> to the head
*/
function addPrefetch(kind, url, as) {
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

export { addPrefetch, deIndent };