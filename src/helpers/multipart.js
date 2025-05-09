import busboy from 'busboy';
import { Readable } from 'node:stream';


export async function* streamMultipart(body, options) {
  const queue = [];
  let pending = true;
  let next;
  function enqueue(entry) {
    if (next) {
      next(entry);
      next = null;
    } else {
      queue.push(entry);
    }
  }
  function done() {
    pending = false;
    if (next) {
      next();
      next = null;
    }
  }
  try {
    const bb = busboy(options);
    bb.on('field', (name, val) => enqueue([name, val]));
    bb.on('file', (name, file, info) => {
      enqueue([name, { name: info.filename, stream: file, type: info.mimeType }]);
    });
    bb.on('close', done);
    //bb.on('error', reject);
    Readable.fromWeb(body).pipe(bb);
  } catch (error) {
    done();
  }
  while (pending || queue.length) {
    const nextEntry = queue.length > 0 ? queue.shift() : await (new Promise(resolve => next = resolve));
    if (nextEntry) yield nextEntry;
  }
}