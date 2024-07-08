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