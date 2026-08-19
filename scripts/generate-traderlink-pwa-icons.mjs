import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const repositoryRoot = process.cwd();
const sourcePath = path.join(
  repositoryRoot,
  "assets",
  "brand",
  "traderlink-chainlink-source-512.png",
);
const publicIconDirectory = path.join(repositoryRoot, "public", "icons");
const shiftLeft = 23;
const shiftDown = 4;
const masterSize = 512;

function pngIco(images) {
  const headerSize = 6;
  const entrySize = 16;
  const imageOffset = headerSize + entrySize * images.length;
  const header = Buffer.alloc(imageOffset);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = imageOffset;
  images.forEach(({ size, data }, index) => {
    const entryOffset = headerSize + index * entrySize;
    header.writeUInt8(size === 256 ? 0 : size, entryOffset);
    header.writeUInt8(size === 256 ? 0 : size, entryOffset + 1);
    header.writeUInt8(0, entryOffset + 2);
    header.writeUInt8(0, entryOffset + 3);
    header.writeUInt16LE(1, entryOffset + 4);
    header.writeUInt16LE(32, entryOffset + 6);
    header.writeUInt32LE(data.length, entryOffset + 8);
    header.writeUInt32LE(offset, entryOffset + 12);
    offset += data.length;
  });

  return Buffer.concat([header, ...images.map(({ data }) => data)]);
}

async function chainCentroid(png) {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let weightedX = 0;
  let weightedY = 0;
  let weightTotal = 0;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      const alpha = data[offset + 3] / 255;
      const brightness = Math.min(red, green, blue);
      const weight = Math.max(0, brightness - 150) * alpha;
      if (weight === 0) continue;
      weightedX += x * weight;
      weightedY += y * weight;
      weightTotal += weight;
    }
  }
  return Object.freeze({
    x: weightedX / weightTotal,
    y: weightedY / weightTotal,
  });
}

const source = await readFile(sourcePath);
const metadata = await sharp(source).metadata();
if (metadata.width !== masterSize || metadata.height !== masterSize) {
  throw new Error("The TraderLink icon source must be exactly 512 by 512 pixels.");
}

const translatedRegion = await sharp(source)
  .extract({
    left: shiftLeft,
    top: 0,
    width: masterSize - shiftLeft,
    height: masterSize - shiftDown,
  })
  .png()
  .toBuffer();

const correctedMaster = await sharp(source)
  .composite([{ input: translatedRegion, left: 0, top: shiftDown }])
  .png()
  .toBuffer();

const sourceCentroid = await chainCentroid(source);
const correctedCentroid = await chainCentroid(correctedMaster);
const measuredShift = Object.freeze({
  x: correctedCentroid.x - sourceCentroid.x,
  y: correctedCentroid.y - sourceCentroid.y,
});
if (
  Math.abs(measuredShift.x + shiftLeft) > 0.05 ||
  Math.abs(measuredShift.y - shiftDown) > 0.05
) {
  throw new Error(
    `Icon translation verification failed: ${measuredShift.x.toFixed(3)}, ${measuredShift.y.toFixed(3)}`,
  );
}

await mkdir(publicIconDirectory, { recursive: true });
await writeFile(path.join(repositoryRoot, "app", "icon.png"), correctedMaster);
await writeFile(
  path.join(repositoryRoot, "app", "apple-icon.png"),
  await sharp(correctedMaster).resize(180, 180).png().toBuffer(),
);
await writeFile(
  path.join(publicIconDirectory, "traderlink-192.png"),
  await sharp(correctedMaster).resize(192, 192).png().toBuffer(),
);
await writeFile(
  path.join(publicIconDirectory, "traderlink-512.png"),
  correctedMaster,
);

const corner = await sharp(source)
  .extract({ left: 0, top: 0, width: 1, height: 1 })
  .ensureAlpha()
  .raw()
  .toBuffer();
const maskableArtwork = await sharp(correctedMaster).resize(410, 410).png().toBuffer();
await writeFile(
  path.join(publicIconDirectory, "traderlink-maskable-512.png"),
  await sharp({
    create: {
      width: masterSize,
      height: masterSize,
      channels: 4,
      background: {
        r: corner[0],
        g: corner[1],
        b: corner[2],
        alpha: corner[3] / 255,
      },
    },
  })
    .composite([{ input: maskableArtwork, left: 51, top: 51 }])
    .png()
    .toBuffer(),
);

const faviconImages = await Promise.all(
  [16, 32, 48].map(async (size) => Object.freeze({
    size,
    data: await sharp(correctedMaster).resize(size, size).png().toBuffer(),
  })),
);
await writeFile(
  path.join(repositoryRoot, "app", "favicon.ico"),
  pngIco(faviconImages),
);

process.stdout.write(
  [
    `Original centroid: ${sourceCentroid.x.toFixed(2)}, ${sourceCentroid.y.toFixed(2)}`,
    `Corrected centroid: ${correctedCentroid.x.toFixed(2)}, ${correctedCentroid.y.toFixed(2)}`,
    `Measured shift: ${measuredShift.x.toFixed(2)}, ${measuredShift.y.toFixed(2)}`,
  ].join("\n") + "\n",
);
