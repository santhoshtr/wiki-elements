function getImageData(imageUrl, region = { x: 0, y: 0, width: 0, height: 0 }) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d', { colorSpace: "display-p3" })
        img.onload = () => {
            canvas.height = img.height
            canvas.width = img.width
            context.drawImage(img, 0, 0)
            const { x, y, width, height } = region
            const data = context.getImageData(
                x, y, width || img.width, height || img.height,
                { colorSpace: "display-p3" }).data

            resolve(data)
        }
        img.onerror = () => reject(Error(`Failed to load image at ${imageUrl}`));

        img.src = imageUrl;
    });
}

function getAverageColor(data, sample = 1) {
    const amount = data.length / sample
    const rgb = { r: 0, g: 0, b: 0 }
    const gap = 4 * sample;
    for (let i = 0; i < data.length; i += gap) {
        rgb.r += data[i]
        rgb.g += data[i + 1]
        rgb.b += data[i + 2]
    }

    return [
        Math.round(rgb.r / amount),
        Math.round(rgb.g / amount),
        Math.round(rgb.b / amount)
    ]
}

function isSameColor(data) {
    let prevr, prevg, prevb;

    const gap = 4;
    for (let i = 0; i < data.length; i += gap) {
        const r = data[i]
        const g = data[i + 1];
        const b = data[i + 2];
        if (prevr !== undefined && prevg !== undefined && prevb !== undefined) {
            if (prevr !== r || prevg !== g || prevb !== b) {
                return false;
            }
        }
        prevr = r;
        prevg = g;
        prevb = b;
    }

    return true; // all colors are the same
}

const group = (number, grouping) => {
    const grouped = Math.round(number / grouping) * grouping

    return Math.min(grouped, 255)
}


function getProminentColor(data, sample = 1, amount = 1, groupby = 3) {
    const gap = 4 * sample
    const colors = {}

    for (let i = 0; i < data.length; i += gap) {
        const rgb = [
            group(data[i], groupby),
            group(data[i + 1], groupby),
            group(data[i + 2], groupby),
        ].join()

        colors[rgb] = colors[rgb] ? colors[rgb] + 1 : 1
    }

    return Object.entries(colors)
        .sort(([_keyA, valA], [_keyB, valB]) => valA > valB ? -1 : 1)
        .slice(0, amount)
        .map(([rgb]) => rgb.split(',').map(Number))
}




function getLuminance(r, g, b) {
    const a = [r, g, b].map(function (v) {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(luminance1, luminance2) {
    const brightest = Math.max(luminance1, luminance2);
    const darkest = Math.min(luminance1, luminance2);
    return (brightest + 0.05) / (darkest + 0.05);
}

function getColorTheme(bgColor) {
    const rgb = bgColor.match(/\d+/g).map(Number);
    const bgLuminance = getLuminance(rgb[0], rgb[1], rgb[2]);
    const whiteLuminance = getLuminance(255, 255, 255);
    const blackLuminance = getLuminance(0, 0, 0);

    const whiteContrast = getContrastRatio(bgLuminance, whiteLuminance);
    const blackContrast = getContrastRatio(bgLuminance, blackLuminance);
    console.log({ bgLuminance, whiteLuminance, blackLuminance, whiteContrast, blackContrast });

    return whiteContrast > blackContrast ? "dark" : "light";
}

const average = (imageUrl) => {
    return new Promise((resolve, reject) => {
        if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
            throw new Error('Invalid image URL');
        }
        getImageData(imageUrl)
            .then((data) => resolve(getAverageColor(data)))
            .catch((error) => reject(error))
    });
}

const prominent = (imageUrl) => {
    return new Promise((resolve, reject) => {
        if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
            throw new Error('Invalid image URL');
        }

        getImageData(imageUrl)
            .then((data) => resolve(getProminentColor(data)))
            .catch((error) => reject(error));
    });
}

const getContinuousColor = async (imageUrl) => {
    if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
        throw new Error('Invalid image URL');
    }
    let region = { x: 0, y: 0, width: 2, height: 0 }
    const imageData = await getImageData(imageUrl, region);
    // check if imageData is same color
    if (isSameColor(imageData)) {
        console.log('imageData is same color');
        return [imageData[0], imageData[1], imageData[2], imageData[3]]
    }
    return await getProminentColor(imageData)[0]
    // return await getAverageColor(imageData)
}

export {
    average,
    prominent,
    getContinuousColor,
    getColorTheme,
};
