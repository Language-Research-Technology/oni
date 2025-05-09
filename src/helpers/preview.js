import { Preview } from 'ro-crate-html';
import HtmlFile from 'ro-crate-html/lib/ro-crate-preview-file.js';
import { createReadStream } from "node:fs";
import { writeFile, stat } from "node:fs/promises";
import path, { join } from 'node:path';
import { createFactory } from 'hono/factory';
import { Readable } from 'node:stream';


export async function createPreview({ crc32, File, crate, previewPath, internalPrefix }) {
  const crateId = crate.rootId;
  crc32.init();
  const preview = new Preview(crate);
  const html = new HtmlFile(preview);
  const content = await html.render();
  const filename = path.join(previewPath, encodeURIComponent(crateId));
  await writeFile(filename, content);
  crc32.update(content);
  const stats = await stat(filename);
  await File.create({
    path: internalPrefix + '/' + encodeURIComponent(crateId),
    logicalPath: 'ro-crate-preview.html',
    crateId,
    size: stats.size,
    crc32: crc32.digest('hex'),
    lastModified: stats.mtime
  });

}

const factory = createFactory();
export function previewRoute(previewPath, previewPathInternal) {
  return factory.createHandlers((c, next) => {
    const crateId = c.req.param('id');
    if (c.req.header('via')?.includes('nginx')) {
      c.header('X-Accel-Redirect', previewPathInternal + '/' + encodeURIComponent(encodeURIComponent(crateId)));
      return c.body('');
    } else {
      const rs = Readable.toWeb(createReadStream(join(previewPath, encodeURIComponent(crateId)), 'utf8'));
      c.header('Content-Type', 'text/html');
      return c.body(rs, 200);
    }
  });
}