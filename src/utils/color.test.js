
import { getColorTheme } from "../utils/color.js";

// Test case 1: Light color
const color1 = "rgb(255, 255, 255)";
console.log(getColorTheme(color1)); // Output: 'light'

// Test case 2: Dark color
const color2 = "rgb(0, 0, 0)";
console.log(getColorTheme(color2)); // Output: 'dark'

// Test case 3: Medium color
const color3 = "rgb(128, 128, 128)";
console.log(getColorTheme(color3)); // Output: 'light' or 'dark' (depending on the contrast threshold)

// Test case 4: Custom color
const color4 = "rgb(100, 200, 50)";
console.log(getColorTheme(color4)); // Output: 'light' or 'dark' (depending on the contrast threshold)