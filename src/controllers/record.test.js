import path from "node:path";
import { expect } from "expect";
import { ROCrate } from "ro-crate";
import { readJSON } from "fs-extra/esm";
import { transformURIs } from "./record.js";


describe('controllers/record', function () {
  describe('transformURIs', function () {
    it('can transform file uri', async function () {
      const crate = await readJSON(path.resolve(import.meta.dirname, '../../test-data/ocfl/corpus-of-oni/ro-crate-metadata.json'));
      const c = transformURIs({
        baseUrl: 'https://test.com',
        crate,
        types: ['File']
      });
      const roc = new ROCrate(c, {link:true, array:true});
      console.log(roc.toJSON());
      for (const id of [
        // 'https://test.com/object/arcp%3A%2F%2Fname%2Ccorpus-of-oni/data.txt',
        // 'https://test.com/object/arcp%3A%2F%2Fname%2Ccorpus-of-oni/image.jpg',
        // 'https://test.com/object/arcp%3A%2F%2Fname%2Ccorpus-of-oni/intro.txt',
        // 'https://test.com/object/arcp%3A%2F%2Fname%2Ccorpus-of-oni/media/intro.mpeg',
        // 'https://test.com/object/arcp%3A%2F%2Fname%2Ccorpus-of-oni/history.pdf'
        'https://test.com/stream?id=arcp%3A%2F%2Fname%2Ccorpus-of-oni&path=data.txt',
        'https://test.com/stream?id=arcp%3A%2F%2Fname%2Ccorpus-of-oni&path=image.jpg',
        'https://test.com/stream?id=arcp%3A%2F%2Fname%2Ccorpus-of-oni&path=intro.txt',
        'https://test.com/stream?id=arcp%3A%2F%2Fname%2Ccorpus-of-oni&path=media%2Fintro.mpeg',
        'https://test.com/stream?id=arcp%3A%2F%2Fname%2Ccorpus-of-oni&path=history.pdf'
      ]) {
        expect(roc.getEntity(id)).toBeDefined();
      }
    });
  });
});