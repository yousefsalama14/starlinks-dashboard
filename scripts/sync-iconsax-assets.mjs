import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const sourceDirectory = path.join(projectDirectory, 'node_modules', 'iconsax', 'dist');
const targetDirectory = path.join(projectDirectory, 'public', 'iconsax');

try {
  await stat(sourceDirectory);
} catch {
  throw new Error('Iconsax is not installed. Run npm install before syncing its assets.');
}

await rm(targetDirectory, { recursive: true, force: true });
await mkdir(path.dirname(targetDirectory), { recursive: true });
await cp(sourceDirectory, targetDirectory, { recursive: true });

console.log('Copied Iconsax runtime assets to public/iconsax.');
