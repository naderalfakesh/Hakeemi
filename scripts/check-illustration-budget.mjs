import { readdir, stat } from 'node:fs/promises';

const illustrationDirectory = new URL('../assets/illustrations/', import.meta.url);
const maximumAssetBytes = 150 * 1024;
const maximumTotalBytes = 1024 * 1024;

const entries = await readdir(illustrationDirectory);
const legacyPngFiles = entries.filter((entry) => entry.endsWith('.png'));
const webpFiles = entries.filter((entry) => entry.endsWith('.webp')).sort();

if (legacyPngFiles.length > 0) {
  throw new Error(`Illustrations must use WebP: ${legacyPngFiles.join(', ')}`);
}

if (webpFiles.length === 0) {
  throw new Error('No bundled WebP illustrations were found.');
}

const assets = await Promise.all(
  webpFiles.map(async (file) => ({
    file,
    size: (await stat(new URL(file, illustrationDirectory))).size,
  })),
);
const oversizedAssets = assets.filter(({ size }) => size > maximumAssetBytes);
const totalBytes = assets.reduce((total, { size }) => total + size, 0);

if (oversizedAssets.length > 0) {
  throw new Error(
    `Illustrations exceed the ${formatBytes(maximumAssetBytes)} per-file budget: ${oversizedAssets
      .map(({ file, size }) => `${file} (${formatBytes(size)})`)
      .join(', ')}`,
  );
}

if (totalBytes > maximumTotalBytes) {
  throw new Error(
    `Illustrations total ${formatBytes(totalBytes)}, above the ${formatBytes(maximumTotalBytes)} budget.`,
  );
}

console.log(
  `Illustration budget passed: ${webpFiles.length} WebP assets, ${formatBytes(totalBytes)} total.`,
);

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}
