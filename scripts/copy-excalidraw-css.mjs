import { promises as fs } from 'node:fs';
import { dirname, resolve } from 'node:path';

async function main() {
  try {
    const projectRoot = resolve(process.cwd());
    const candidates = [
      resolve(projectRoot, 'node_modules/@excalidraw/excalidraw/dist/prod/index.css'),
      resolve(projectRoot, 'node_modules/@excalidraw/excalidraw/dist/dev/index.css'),
    ];

    let src = null;
    for (const c of candidates) {
      try {
        await fs.access(c);
        src = c;
        break;
      } catch {}
    }

    if (!src) {
      console.warn('[copy-excalidraw-css] Could not locate Excalidraw CSS in node_modules.');
      return;
    }

    const outDir = resolve(projectRoot, 'public');
    const outFile = resolve(outDir, 'excalidraw.css');
    await fs.mkdir(outDir, { recursive: true });
    const css = await fs.readFile(src, 'utf8');
    await fs.writeFile(outFile, css, 'utf8');
    console.log('[copy-excalidraw-css] Copied', src, '->', outFile);
  } catch (e) {
    console.warn('[copy-excalidraw-css] Failed:', e?.message || e);
  }
}

main();

