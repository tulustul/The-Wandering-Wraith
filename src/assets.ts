import { PlantDefinition, animateTree, animateGrass } from "./plants";
import { SpriteRenderer } from "./renderer/sprite-renderer";
import { TREE_GROUND_MASK, GRASS_MASK } from "./colisions-masks";
import { Random } from "./random";

export type SoundDefinition = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

interface Assets {
  terrain: HTMLImageElement;
  head_: HTMLImageElement;
  torso: HTMLImageElement;
  eyes: HTMLImageElement;
  limb: HTMLImageElement;
  plants: PlantDefinition[];
  sounds: {
    jump: SoundDefinition;
    dash: SoundDefinition;
    walk: SoundDefinition;
    dead: SoundDefinition;
    hit: SoundDefinition;
    collect: SoundDefinition;
    bubbleEnd: SoundDefinition;
  };
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
      frames: await animateTree(
        sr,
        depth,
        r.nextFloat() / 4 + 0.3,
        5 * depth,
        depth,
      ),
      spread: 25 * Math.pow(depth, 1.3),
      mask: TREE_GROUND_MASK,
    });
  }

  for (let i = 0; i < 4; i++) {
    plants.push({
      frames: await animateGrass(sr, 1 + i * 0.5, i),
      spread: 5 + i,
      mask: GRASS_MASK,
    });
  }
  return plants;
}

export const assets: Assets = {} as any;

export async function prepareAssets() {
  assets.head_ = await svgToImg("head");
  assets.eyes = await svgToImg("eyes");
  assets.torso = await svgToImg("torso");
  assets.limb = await svgToImg("limb");
  assets.plants = await preparePlants();

  assets.sounds = {
    dash: [0.6, 1, 200, 0.1, 0.47, 4.2, 1.4, 1, 0.15],
    jump: [0.6, 1, 150, 0.15, 0.47, 4.2, 1.4, 1, 0.25],
    walk: [0.4, 0.6, 50, 0.02, 0.54, 4, 0.9, 10.7, 0.37],
    dead: [0.8, 0.7, 450, 0.5, 0.21, 11.3, 0.8, 7, 0.56],
    hit: [1, 0.1, 304, 0.2, 0.01, 0, 0.3, 0, 0.5],
    collect: [0.8, 0, 10, 0.2, 0.88, 1, 0.3, 10, 0.41],
    bubbleEnd: [1, 0.1, 428, 0.2, 0.31, 0, 0.2, 5.1, 0.42],
  };
}
