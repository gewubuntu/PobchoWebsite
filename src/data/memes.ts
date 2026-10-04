// Meme generator templates and their default text boxes.
// Text box geometry is expressed as divisors of the template image size, e.g. `left: 2` → image.width / 2.

export type TextBox = {
  text: string;
  fontSize: number;
  left: number;
  top: number;
  width: number;
  /** Vertically centre the box on `top` instead of hanging it from there. */
  centerY?: boolean;
};

const createYourMeme = "Create Your\nPoncho Meme";
const topBottom: TextBox[] = [
  { text: "Top Text", fontSize: 10, left: 2, top: 18, width: 1.25 },
  { text: "Bottom Text", fontSize: 10, left: 2, top: 1.21, width: 1.25 },
];
const centered: TextBox[] = [{ text: createYourMeme, fontSize: 10, left: 2, top: 2, width: 1.5, centerY: true }];

export const templates: { name: string; text: TextBox[] }[] = [
  { name: "Transparent", text: centered },
  { name: "With_Sign", text: [{ text: createYourMeme, fontSize: 10, left: 2, top: 6, width: 1.5 }] },
  { name: "Change_My_Mind", text: [{ text: createYourMeme, fontSize: 13, left: 2, top: 1.515, width: 2 }] },
  { name: "Smart", text: [{ text: createYourMeme, fontSize: 13, left: 1.282, top: 13.5, width: 4 }] },
  {
    name: "Drake_Hotline_Bling",
    text: [
      { text: "Poncho\nHate", fontSize: 13, left: 1.315, top: 6.6, width: 3 },
      { text: "Poncho\nLike", fontSize: 13, left: 1.315, top: 1.53, width: 3 },
    ],
  },
  { name: "Truck", text: [{ text: createYourMeme, fontSize: 7, left: 2.65, top: 3.4, width: 2 }] },
  { name: "Dark_Army", text: [{ text: createYourMeme, fontSize: 10, left: 2, top: 16, width: 1.5 }] },
  { name: "Pepe", text: [{ text: createYourMeme, fontSize: 10, left: 3.23, top: 12, width: 2 }] },
  { name: "Ponchonator", text: [{ text: "The\nPonchonator", fontSize: 13, left: 2, top: 1.4, width: 1.25 }] },
  { name: "Gold_Poncho", text: topBottom },
  { name: "Celebration", text: topBottom },
  { name: "McDonalds", text: topBottom },
  {
    name: "Brain_Jeet_Holder",
    text: [
      { text: "Jeeter", fontSize: 10, left: 4, top: 6, width: 3 },
      { text: "Poncho Holder", fontSize: 10, left: 1.33, top: 6, width: 3 },
    ],
  },
  { name: "Brain_Jeet", text: [{ text: "Jeeter", fontSize: 10, left: 2, top: 6, width: 1.5 }] },
  { name: "Brain_Holder", text: [{ text: "Poncho Holder", fontSize: 10, left: 2, top: 6, width: 1.5 }] },
  { name: "Workout", text: topBottom },
  { name: "Dark_Planet", text: [{ text: createYourMeme, fontSize: 10, left: 2, top: 1.45, width: 1.25 }] },
  {
    name: "Death",
    text: [
      { text: "Poncho\n$0.1", fontSize: 15, left: 10, top: 6, width: 6 },
      { text: "Poncho\n$0.2", fontSize: 15, left: 2.5, top: 6, width: 6 },
      { text: "Poncho\n$2", fontSize: 15, left: 1.25, top: 6, width: 6 },
    ],
  },
  ...[
    "Background",
    "BASE_Blue",
    "Beige",
    "Blackout",
    "Green",
    "Light_Blue",
    "OG",
    "Orange",
    "Pink",
    "Punk",
    "Purple",
  ].map((name) => ({ name, text: centered })),
];

export const defaultTemplate = "With_Sign";

export const assetGroups = [
  { id: "1_Fur", label: "Fur" },
  { id: "2_Eyebrows", label: "Eyebrows" },
  { id: "3_Mouth", label: "Mouth" },
  { id: "4_Eyes", label: "Eyes" },
  { id: "5_Hat", label: "Hat" },
  { id: "6_Other", label: "Other" },
] as const;

/** "Sombrero_Black&Orange.png" → "Sombrero Black & Orange" */
export const toTitle = (filename: string) =>
  filename
    .replace(/\.[^.]+$/, "")
    .replaceAll("_", " ")
    .replaceAll("&", " & ");
