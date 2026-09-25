// Color palette para sa buong laro
export const PALETTE = {
    0: null,
    1: "#090d16", // Dark crisp outline
    2: "#334155", // Dark steel plate
    3: "#64748b", // Steel armor midtone
    4: "#cbd5e1", // Polished silver / Lance shaft
    5: "#ffffff", // Pure white glint / Slash arc
    6: "#dc2626", // Crimson plume & sash
    7: "#f87171", // Bright plume highlight
    8: "#451a03", // Wood deep shadow
    9: "#78350f", // Wood rich midtone
    A: "#d97706", // Gold brass rim & hilt
    B: "#f59e0b", // Gold shield trim / Amber glint
    b: "#b45309", // Deep gold shade
    // Knight symbols
    H: "#94a3b8", // Polished Plate Armor
    h: "#475569", // Dark Under-Armor Steel
    G: "#475569", // Tower Shield Iron Plate
    g: "#334155", // Dark Shield Plate
    R: "#dc2626", // Crimson Plume
    r: "#991b1b", // Dark Plume Shadow
    O: "#ffd166", // Amber Visor Glow
    o: "#ffffff", // Eye Specular
    S: "#f3c5a5", // Fair Skin Tone
    s: "#c78f6c", // Skin Shadow
    // Mage colors
    C: "#1e1338", D: "#3a206b", E: "#7e52c7", F: "#00f0ff",
    // Priest colors
    I: "#9fb3c8", J: "#ffd166", K: "#06d6a0",
    // Archer colors
    L: "#2d5a27", M: "#1e3f1a", N: "#c98a4c",
    // Fighter colors
    P: "#e11d48", Q: "#f8fafc", p: "#9f1239",
    // Slime & Monster colors
    T: "#38b000", U: "#70e000", V: "#004b23", W: "#ffffff",
    X: "#ccff33", Y: "#9ef01a", Z: "#007200"
};

export function parseSprite(strArray) {
    return strArray.map(row =>
        row.split("").map(char => (char === "." ? 0 : PALETTE[char]))
    );
}

// SLIME SPRITES
export const slimeIdle = [
    parseSprite([
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        ".........11111..........",
        ".......11UUUUU11........",
        "......1UUUUUUUUU1.......",
        ".....1UU1WUUUW1UU1......",
        ".....1UUTWTUUTWTU1......",
        ".....1UUT1TUUT1TU1......",
        "....1UUUUUUUUUUUUU1.....",
        "....1TTTTTTTTTTTTT1.....",
        "....1TTTVVVVVVVTTT1.....",
        ".....1VVVVVVVVVVV1......",
        "......11111111111.......",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................"
    ]),
    parseSprite([
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........1111111.........",
        "......11UUUUUUU11.......",
        ".....1UUUUUUUUUUU1......",
        "....1UUU1WUUUW1UUU1.....",
        "....1UUUTWTUUTWTUU1.....",
        "....1UUUT1TUUT1TUU1.....",
        "...1UUUUUUUUUUUUUUU1....",
        "...1TTTTTTTTTTTTTTT1....",
        "....1VVVVVVVVVVVVV1.....",
        ".....1111111111111......",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................"
    ])
];

/**
 * Universal 1:1 Pixel Matrix Renderer with support for flash effects and horizontal flipping.
 */
export function drawSpriteMatrix(targetCtx, x, y, spriteGrid, flashWhite = false, flipX = false) {
    if (!spriteGrid) return;
    const numRows = spriteGrid.length;
    const numCols = spriteGrid[0] ? spriteGrid[0].length : 0;
    const startX = Math.floor(x);
    const startY = Math.floor(y);

    for (let r = 0; r < numRows; r++) {
        const row = spriteGrid[r];
        const rowLen = row.length;
        for (let c = 0; c < rowLen; c++) {
            const color = row[c];
            if (color && color !== 0) {
                targetCtx.fillStyle = flashWhite ? "#ffffff" : color;
                const drawX = flipX ? (startX + numCols - 1 - c) : (startX + c);
                targetCtx.fillRect(drawX, startY + r, 1, 1);
            }
        }
    }
}