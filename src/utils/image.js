const getImageDimensions = (imageUrl) => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "Anonymous";
		img.onload = () => {
			resolve({ width: img.width, height: img.height });
		};
		img.onerror = () => {
			reject(Error(`Failed to load image at ${imageUrl}`));
		};
		img.src = imageUrl;
	});
};

export { getImageDimensions };
