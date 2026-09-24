// Color palette para sa buong laro
export const PALETTE = {
    0: null,
    1: "#14171d", // Dark outline
    2: "#4a5468", // Dark steel
    3: "#7d8c9e", // Plate armor midtone
    4: "#b5c4d4", // Polished steel
    5: "#ffffff", // Pure white glint / Slash arc
    6: "#942c2c", // Helmet plume & sash (Red)
    7: "#e04c4c", // Plume bright highlight
    8: "#4e311a", // Wood dark
    9: "#7d522c", // Wood midtone
    A: "#c29138", // Gold brass rim & hilt
    B: "#fcd168", // Gold glint
    // Mage colors
    C: "#2c1c4d", D: "#5a3d91", E: "#9b72cf", F: "#38b6ff", G: "#ff7700",
    // Priest colors
    H: "#d9e2ec", I: "#9fb3c8", J: "#ffd166", K: "#06d6a0",
    // Archer colors
    L: "#2d5a27", M: "#1e3f1a", N: "#c98a4c", O: "#ffe3b3",
    // Fighter colors
    P: "#c73e3a", Q: "#f0f2f5", R: "#b0b8c4", S: "#e09f67",
    // Slime colors
    T: "#38b000", U: "#70e000", V: "#004b23", W: "#ffffff"
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