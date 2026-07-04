import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pngPath = path.join(root, 'build', 'icon.png');
const squarePath = path.join(root, 'build', 'icon-square.png');
const icoPath = path.join(root, 'build', 'icon.ico');

if (!fs.existsSync(pngPath)) {
  console.warn('build/icon.png not found — installer will use default Electron icon.');
  process.exit(0);
}

await sharp(pngPath)
  .resize(256, 256, { fit: 'contain', background: { r: 30, g: 58, b: 95, alpha: 1 } })
  .png()
  .toFile(squarePath);

const ico = await pngToIco(squarePath);
fs.writeFileSync(icoPath, ico);
console.log('Created build/icon.ico');
