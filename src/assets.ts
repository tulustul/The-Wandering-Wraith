import { TreeDefinition, animateTree } from "./plants";
import { SpriteRenderer } from "./renderer/sprite-renderer";

interface Assets {
  terrain: HTMLImageElement;
  head: HTMLImageElement;
  torso: HTMLImageElement;
  eyes: HTMLImageElement;
  limb: HTMLImageElement;
  trees: TreeDefinition[];
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

async function prepareTrees(): Promise<TreeDefinition[]> {
  const sr = new SpriteRenderer();

  return [
    { frames: await animateTree(sr, 4, 0.5, 28, 11), density: 80 },
    { frames: await animateTree(sr, 5, 0.2, 30, 13), density: 90 },
    { frames: await animateTree(sr, 7, 0.5, 45, 3), density: 400 },
    { frames: await animateTree(sr, 7, 0.4, 45, 6), density: 450 },
    { frames: await animateTree(sr, 8, 0.4, 55, 2), density: 500 },
    { frames: await animateTree(sr, 9, 0.35, 65, 1), density: 700 },
    { frames: await animateTree(sr, 9, 0.5, 65, 4), density: 800 },
    { frames: await animateTree(sr, 10, 0.4, 95, 5), density: 1200 },
  ];
}

export const assets: Assets = {} as any;

export async function prepareAssets() {
  assets.terrain = await svgToImg("a");
  assets.head = await svgToImg("head");
  assets.eyes = await svgToImg("eyes");
  assets.torso = await svgToImg("torso");
  assets.limb = await svgToImg("limb");
  assets.trees = await prepareTrees();
}
