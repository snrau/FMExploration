const characterColors = {
    harmonic: "rgb(0, 0, 255)",
    residual: "rgb(255, 165, 0)",
    percussive: "rgb(255, 0, 0)",
};

function normalizeBrightness(value, brightnessExtent) {
    const [min, max] = brightnessExtent;
    return (value - min) / (max - min);
}

export function getColor(point, brightnessExtent) {
    // Base color based on character
    const baseColor = characterColors[point.analysis.character.character] || "gray";

    // Adjust brightness using HSL (lightness component)
    const normalizedBrightness = normalizeBrightness(point.analysis.brightness.mean, brightnessExtent);
    const color = adjustBrightness(baseColor, normalizedBrightness);

    return color;
}



function adjustBrightness(baseColor, brightness) {
    // Convert the color to HSL, adjust the lightness, and return the updated color
    const color = new Option().style; // Temp to use the browser's parsing
    color.color = baseColor;

    const hslMatch = color.color.match(
        /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/i
    );
    if (!hslMatch) return baseColor;

    const [_, r, g, b] = hslMatch.map(Number);

    // Convert RGB to HSL
    const { h, s, l } = rgbToHsl(r, g, b);
    const newL = brightness * 60 + 20; // Scale brightness to percentage

    // Convert back to RGB
    const { r: newR, g: newG, b: newB } = hslToRgb(h, s, newL);

    return `rgb(${newR}, ${newG}, ${newB})`;
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    let h,
        s,
        l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0,
        g = 0,
        b = 0;

    if (0 <= h && h < 60) {
        r = c;
        g = x;
        b = 0;
    } else if (60 <= h && h < 120) {
        r = x;
        g = c;
        b = 0;
    } else if (120 <= h && h < 180) {
        r = 0;
        g = c;
        b = x;
    } else if (180 <= h && h < 240) {
        r = 0;
        g = x;
        b = c;
    } else if (240 <= h && h < 300) {
        r = x;
        g = 0;
        b = c;
    } else if (300 <= h && h < 360) {
        r = c;
        g = 0;
        b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return { r, g, b };
}