/**
 * Add a <link rel={preload | preconnect} ...> to the head
 */
function addPrefetch(kind, url, as) {
	if (document.querySelector(`link[rel="${kind}"][href="${url}"]`)) {
		return; // Link already exists, no need to add it again
	}

	const linkEl = document.createElement("link");
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
const addScript = async (src) =>
	new Promise((resolve, reject) => {
		const existingEl = document.querySelector(`script[src="${src}"]`);
		if (existingEl) {
			existingEl.addEventListener("load", resolve);
			return; // Script already exists, no need to add it again
		}

		const el = document.createElement("script");
		el.src = src;
		el.crossorigin = "";
		el.addEventListener("load", resolve);
		el.addEventListener("error", reject);
		document.body.append(el);
	});

/**
 * Adds a stylesheet to the document dynamically.
 *
 * @param {string} src - The URL of the stylesheet to be added.
 * @returns {Promise<void>} A promise that resolves when the stylesheet is loaded successfully, or rejects if there was an error.
 */
const addStyle = async (src) =>
	new Promise((resolve, reject) => {
		if (document.querySelector(`link[href="${src}"]`)) {
			resolve();
			return; // Style already exists, no need to add it again
		}

		const el = document.createElement("link");
		el.rel = "stylesheet";
		el.href = src;
		el.crossorigin = "";
		el.addEventListener("load", resolve);
		el.addEventListener("error", reject);
		document.head.append(el);
	});

/**
 * Detects the language of the given text using the langid API.
 * @param {string} text - The text to detect the language for.
 * @param {number} [threshold=0.4] - The threshold score for language detection. If the score is below the threshold, the fallback language will be used.
 * @param {string} [fallback="en"] - The fallback language to use if the detected language score is below the threshold.
 * @returns {Promise<string>} A promise that resolves to the detected language code.
 */
const detectLanguage = async (text, threshold = 0.4, fallback = "en") => {
	const API_URL =
		"https://api.wikimedia.org/service/lw/inference/v1/models/langid:predict";

	// langid api expects a single line of text.
	const firstline = text.split("\n")[0];
	return fetch(API_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			text: firstline,
		}),
	})
		.then((response) => response.json())
		.then((result) => (result.score < threshold ? fallback : result.wikicode));
};

async function sha256(inputString) {
	if (!window.crypto.subtle) {
		// Only available in secure contexts (HTTPS)
		return null;
	}
	const msgUint8 = new TextEncoder().encode(inputString); // encode as (utf-8) Uint8Array
	const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8); // hash the message
	const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join(""); // convert bytes to hex string
	return hashHex;
}

const getSourceSetFromCommonsUrl = (url) => {
	// Refer https://phabricator.wikimedia.org/T360589 for most used sizes
	const sizes = [440, 640, 960, 1024, 1280, 1920];
	let urlPrefix, srcsetImgName;

	if (!url.includes("thumb")) {
		const urlParts = url.split("/");
		urlPrefix = urlParts
			.slice(0, -1)
			.join("/")
			.replace("/commons/", "/commons/thumb/");
		srcsetImgName = urlParts[urlParts.length - 1];
	} else {
		const urlParts = url.split("/");
		urlPrefix = urlParts.slice(0, -2).join("/");
		srcsetImgName = urlParts[urlParts.length - 2];
	}

	if (urlPrefix.startsWith("//")) {
		urlPrefix = `https:${urlPrefix}`;
	}

	let filename = srcsetImgName;
	if (
		filename.endsWith("svg") ||
		filename.endsWith("tif") ||
		filename.endsWith("pdf")
	) {
		filename += ".jpg";
	}
	// replace jpg, png, jpeg with webp
	// When webp is widely supported, we can use this
	// filename = filename.replace(/\.(jpg|png|jpeg)$/, ".webp");

	const srcset = sizes.map(
		(width) => `${urlPrefix}/${srcsetImgName}/${width}px-${filename} ${width}w`,
	);

	return srcset;
};

/**
 * A template literal tag 'html' that creates an HTML <template> element from the contents of the string,
 *
 * - It's efficient: The browser doesn't render the content of a <template> element until it's used.
 * - It's reusable: You can clone the template's content multiple times.
 *  - It's safe: The content is parsed as HTML, so you don't need to worry about XSS attacks from the  interpolated values.
 * @param {Array<string>} strings - An array of strings representing the HTML template.
 * @param {...any} values - The dynamic values to be inserted into the HTML template.
 * @returns {HTMLTemplateElement} The template element created from the HTML string.
 */
function html(strings, ...values) {
	// Combine the strings and values
	const rawHTML = strings.reduce((result, string, i) => {
		return result + string + (values[i] || "");
	}, "");

	// Create a template element
	const template = document.createElement("template");

	// Set the innerHTML of the template
	template.innerHTML = rawHTML.trim();

	// Return the template element
	return template;
}

function css(strings, ...values) {
	// Combine the strings and values
	const rawCSS = strings.reduce((result, string, i) => {
		return result + string + (values[i] || "");
	}, "");

	// Create a style element
	const style = document.createElement("style");

	// Set the innerHTML of the style
	style.innerHTML = rawCSS.trim();

	// Return the style element
	return style;
}

function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

export {
	addPrefetch,
	addScript,
	addStyle,
	css,
	debounce,
	deIndent,
	detectLanguage,
	getSourceSetFromCommonsUrl,
	html,
	sha256,
};
