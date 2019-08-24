import { PlantDefinition, animateTree, animateGrass } from "./plants";
import { SpriteRenderer } from "./renderer/sprite-renderer";
import { TREE_GROUND_MASK, GROUND_MASK } from "./colisions-masks";
import { Random } from "./random";

interface Assets {
  terrain: HTMLImageElement;
  head: HTMLImageElement;
  torso: HTMLImageElement;
  eyes: HTMLImageElement;
  limb: HTMLImageElement;
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
      frames: await animateTree(
        sr,
        depth,
        r.nextFloat() / 4 + 0.3,
        5 * depth,
        depth,
      ),
      spread: 35 * depth,
      mask: TREE_GROUND_MASK,
    });
  }

  for (let i = 0; i < 4; i++) {
    plants.push({
      frames: await animateGrass(sr, i),
      spread: 10,
      mask: GROUND_MASK,
    });
  }
  return plants;
}

export const assets: Assets = {} as any;

export async function prepareAssets() {
  assets.terrain = await svgToImg("a");
  assets.head = await svgToImg("head");
  assets.eyes = await svgToImg("eyes");
  assets.torso = await svgToImg("torso");
  assets.limb = await svgToImg("limb");
  assets.plants = await preparePlants();
}
