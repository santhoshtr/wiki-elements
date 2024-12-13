function generateTableOfContents() {
    const toc = document.createElement("section");
    toc.id = "toc";
    toc.classList.add("article-nav");

    // Find all h2 and h3 elements
    const headings = document.querySelectorAll("article h4, article h5 ");
    const stack = [];
    let lastLevel = 2;
    let lastList = toc;
    for (const heading of headings) {
        const level = parseInt(heading.tagName[1]);
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#" + heading.id;
        a.textContent = heading.textContent;
        li.append(a);
        if (level === lastLevel) {
            lastList.append(li);
        }
        else if (level > lastLevel) {
            const newList = document.createElement("ul");
            newList.append(li);
            lastList.append(newList);
            stack.push(lastList);
            lastList = newList;
        }
        else {
            while (level < lastLevel) {
                stack.pop();
                lastList = stack[stack.length - 1];
                lastLevel--;
            }
            lastList.append(li);
        }
        lastLevel = level;
    }

    // Find the nav item that matches the current URL
    const currentURL = new URL(window.location.href);
    const currentPath = currentURL.pathname.split("/").pop();
    const currentNavItem = document.querySelector(`a[href*="${currentPath}"]`);
    currentNavItem.classList.add("active");
    // append to active nav
    currentNavItem.append(toc);
}

function buildNav() {

    document.querySelectorAll('[data-src][data-type="text/html"]').forEach(function (element) {
        var src = element.getAttribute("data-src");
        var html = element.getAttribute("data-type") === "text/html";
        var contentProperty = html ? "innerHTML" : "textContent";

        fetch(src)
            .then(response => response.text())
            .then(data => {
                element[contentProperty] = data;

                // Run JS
                element.querySelectorAll("script").forEach(function (script) {
                    var parent = script.parentNode;
                    parent.removeChild(script);
                    document.head.appendChild(script);
                });
                generateTableOfContents();
            })
            .catch(error => {
                console.error("Error fetching data:", error);
            });
    });


}
function init() {
    if (HTMLScriptElement.supports &&
        HTMLScriptElement.supports("speculationrules")) {
        const specScript = document.createElement("script");
        specScript.type = "speculationrules";
        const specRules = {
            "prerender": [
                {
                    "where": {
                        "href_matches": "/doc/*"
                    },
                    "eagerness": "immediate"
                }
            ]
        };
        specScript.textContent = JSON.stringify(specRules);
        document.body.append(specScript);
    }
    buildNav();

}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener(
    "hashchange",
    () => {
        // uncheck the menu toggle
        document.getElementById("menu-toggle").checked = false;
    },
    false,
);

