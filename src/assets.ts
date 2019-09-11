import { PlantDefinition, animateTree, animateGrass } from "./plants";
import { SpriteRenderer } from "./renderer/sprite-renderer";
import { TREE_GROUND_MASK, GRASS_MASK } from "./colisions-masks";
import { Random } from "./random";

interface Assets {
  terrain: HTMLImageElement;
  head_: HTMLImageElement;
  torso: HTMLImageElement;
  eyes: HTMLImageElement;
  limb: HTMLImageElement;
  scaffold: HTMLImageElement;
  hangman: HTMLImageElement;
  plants: PlantDefinition[];
}

function svgToImg(id: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const svg = document.getElementById(id)!;
    const xml = new XMLSerializer().serializeToString(svg);

    const svg64 = btoa(xml);
    const b64Start = "data:image/svg+xml;base64,";
    const image64 = b64Start + svg64;

    const img = new Image();
    img.onload = () => resolve(img);
    img.src = image64;
  });
}

async function preparePlants(): Promise<PlantDefinition[]> {
  const r = new Random(1);
  const sr = new SpriteRenderer();
  const plants: PlantDefinition[] = [];
  for (let depth = 4; depth < 11; depth++) {
    plants.push({
      frames_: await animateTree(
        sr,
        depth,
        r.nextFloat() / 4 + 0.3,
        5 * depth,
        depth,
      ),
      spread: 25 * Math.pow(depth, 1.3),
      mask_: TREE_GROUND_MASK,
    });
  }

  for (let i = 0; i < 4; i++) {
    plants.push({
      frames_: await animateGrass(sr, 1 + i * 0.5, i),
      spread: 6 + i,
      mask_: GRASS_MASK,
    });
  }
  return plants;
}

export const assets: Assets = {} as any;

export async function prepareAssets() {
  assets.head_ = await svgToImg("h");
  assets.eyes = await svgToImg("e");
  assets.torso = await svgToImg("t");
  assets.limb = await svgToImg("l");
  assets.scaffold = await svgToImg("s");
  assets.hangman = await svgToImg("m");
  assets.plants = await preparePlants();
}
