// Saturated colors that stand out on the map and keep a white pin glyph readable.
export const TAG_PALETTE = [
    "#e03131", // red
    "#1971c2", // blue
    "#2f9e44", // green
    "#e8590c", // orange
    "#9c36b5", // grape
    "#0c8599", // teal
    "#c2255c", // pink
    "#6741d9", // violet
];

// The palette color used least among `colors`, ties going to palette order; off-palette colors don't count.
export const nextTagColor = (colors: string[]) => {
    const counts = new Map(TAG_PALETTE.map(c => [c, 0]));
    for (const color of colors) {
        const key = color.toLowerCase();
        const count = counts.get(key);
        if (count !== undefined) counts.set(key, count + 1);
    }
    return TAG_PALETTE.reduce((best, c) => (counts.get(c)! < counts.get(best)! ? c : best));
};

// Mixes a #rrggbb color toward black, for a pin border that separates it from the map.
export const darken = (hex: string, amount = 0.3) =>
    "#" + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount)).toString(16).padStart(2, "0")).join("");
