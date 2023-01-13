import { getLogger } from '../../services';
import {isEmpty, isUndefined} from 'lodash';
import {
  getRecordConformsTo,
  getRecordMemberOfTop,
  getRecordSingle,
  getRecordMembers,
  getRecordTypes,
  getResolveParts,
  getAllRecordConformsTo
} from './record';
import { getRecordCrate } from './recordCrate';
import { getRecordItem } from './recordItem';
import {routeBearer, routeBrowse} from '../../middleware/auth';

const log = getLogger();

export function setupObjectRoutes({ server, configuration, repository }) {

  /**
   * @openapi
   * /object:
   *   get:
   *     description: |
   *                  ### Object
   *                  Structural search and (limited) discovery end-point. Returns summaries only
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - in: query
   *         name: memberOf
   *         description: Indicates when an object is a member Of another object.
   *       - in: query
   *         name: conformsTo
   *         description: Indicates if an object conforms to a profile URI
   *       - in: query
   *         name: id
   *         description: The ID/crateId of a single record.
   *       - in: query
   *         name: offset
   *         description: The position in the dataset of a particular record.
   *       - in: query
   *         name: limit
   *         description: The limit of the results provided.
   *     responses:
   *       '200':
   *         description: |
   *                      Returns
   *                      - memberOf=id&conformsTo=Collection/Object --> Get members of an ID that conforms to a collection
   *                      - memberOf=id --> Get all the children of id (Not paginated)
   *                      - memberOf=null --> (ie top-level) Get ALL objects which are not part of ANY collection
   *                      - memberOf=null&conformsTo=collectionProfileURI --> All TOP level collections
   *                      - id=id --> Get a single record
   *                      - no parameters --> Get all root ConformsTos paginated
   */
  server.get("/object", async (req, res, next) => {
    if (!isUndefined(req.query.memberOf) && !isUndefined(req.query.conformsTo)) {
      //memberOf=id&conformsTo=Collection/Object/
      // OR
      //memberOf & conformsTo=collectionProfileURI -> All TOP level collections
      await getRecordConformsTo({ req, res, next });
    } else if (!isUndefined(req.query.memberOf)) {
      //memberOf=id -> get all the children of id
      //memberOf=null (ie top-level) Get ALL objects which are not part of ANY collection
      await getRecordMembers({ req, res, next });
    } else if (!isUndefined(req.query.conformsTo)) {
      //conformsTo=collectionProfileURI -> Collections that conformsTo
      await getRecordConformsTo({ req, res, next });
    } else if(req.query.id && !isUndefined(req.query.memberOfTopLevel)) {
      await getRecordMemberOfTop({req, res, next}); // TODO: maybe delete this? Not used?!?
    } else if (req.query.id) {
      await getRecordSingle({ req, res, next });
    } else {
      await getAllRecordConformsTo({req, res, next});
      next();
    }
  });

  /**
   * @openapi
   * /object/meta:
   *   get:
   *     description: |
   *                  ### Object Meta
   *                  Get an RO-Crate Metadata Document with either IDs translated to api compatible or not
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - in: query
   *         name: id
   *         description: Object id/crateId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: resolve-parts
   *         description: Get all the sub parts and deliver as a single ro-crate-metadata document
   *       - in: query
   *         name: types
   *         description: Returns the types of an RO-Crate it might have (Not sure if useful)
   *       - in: query
   *         name: memberOf
   *         description: Returns all items that are members of memberOf
   *       - in: query
   *         name: noUrid
   *         schema:
   *           type: boolean
   *         description: Don’t replace the IDs in the RO-Crate to be API compatible (repeated for compatibility)
   *       - in: query
   *         name: version
   *         description: Not Implemented
   *       - in: query
   *         name: raw
   *         description: Don’t replace the IDs in the RO-Crate to be API compatible (repeated for compatibility)
   *       - in: query
   *         name: zip
   *         description: Not Implemented
   *     responses:
   *       '200':
   *         description: |
   *                      Returns a single whole RO-Crate metadata document
   *                      - Example:
   *                        - Return a complete ro-crate from storage
   *                        - /api/object/meta?id=arcp://name,cooee-corpus/corpus/root&noUrid
   *                      - Example:
   *                        - Return an RO-Crate resolving all parts
   *                        - /api/object/meta?resolve-parts&noUrid&id=arcp://name,sydney-speaks/corpus/root
   *                      - Example:
   *                        - Return an RO-Crate resolving all parts and return each id prefixed with the https endpoint of the object so another machine can fetch all items
   *                        - /api/object/meta?resolve-parts&id=arcp://name,cooee-corpus/corpus/root
   *
   */
  server.get('/object/meta', async (req, res, next) => {
    if (req.query.id) {
      if (!isUndefined(req.query.types)) {
        await getRecordTypes({ req, res, next });
      } else if (!isUndefined(req.query.memberOf)) {
        await getRecordMembers({ req, res, next });
      } else if (!isUndefined(req.query['resolve-parts']) && !isUndefined(req.query.version)) {
        res.json({ message: 'Version and Resolve-Parts: Not implemented' }).status(400);
        next();
      } else if (!isUndefined(req.query['resolve-parts'])) {
        await getResolveParts({ req, res, next, configuration, repository });
      } else {
        await getRecordCrate({ req, res, next, configuration, repository });
      }
    } else {
      res.json({ message: 'id parameter value is required' }).status(400);
      next();
    }
  });

  /**
   * @openapi
   * /object/meta/versions:
   *   get:
   *     description: |
   *                  ### Object Metadata Version
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - in: query
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ocfl version id
   *     responses:
   *       '200':
   *         description: |
   *                      Not implemented
   */
  server.get('/object/meta/versions', async (req, res, next) => {
    if (req.query.id) {
      res.status(400);
      res.json({ message: 'meta version: Not implemented' })
      next();
    } else {
      res.status(400);
      res.json({ message: 'id parameter is required' })
      next();
    }
  });

  /**
   * @openapi
   * /stream:
   *   get:
   *     description: |
   *                  ### Stream File
   *                  Streams file with bearer token
   *                  if path is not included return the ro-crate with parts resolved.
   *                  Same as /object/open but /stream requires the Bearer Token and object/open the browser session
   *     security:
   *      - Bearer: []
   *     parameters:
   *       - in: query
   *         name: id
   *         description: object id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: path
   *         description: path to file
   *       - in: query
   *         name: noUrid
   *     responses:
   *       '200':
   *         description: |
   *                      Streams file requested
   *                      Example:
   *                      Stream the file of coooee with path data/1-215-plain.txt
   *                      /api/object/open?id=arcp://name,cooee-corpus/corpus/root&path=data/1-215-plain.txt
   */
  server.get('/stream',
    routeBearer(
      async function (req, res, next) {
        try {
          if (req.query.id && req.query.path) {
            await getRecordItem({ req, res, next, configuration, repository });
          } else if (req.query.id) {
            await getResolveParts({ req, res, next, configuration, select: [ 'parts' ], repository });
          } else {
            res.status(400);
            res.json({ message: 'id parameter value is required' });
            next();
          }
        } catch
          (e) {
          log.error(e);
          res.json({ error: e['message'] }).status(500);
          next();
        }
      })
  );

  /**
   * @openapi
   * /object/open:
   *   get:
   *     description: |
   *                  ### Object Open
   *                  Returns an object from path if path is not sent resolve its parts of the ro-crate. Same as /stream but /object/open uses the browser session and /stream requires the Bearer Token.
   *     security:
   *      - Bearer: []
   *     parameters:
   *       - in: query
   *         name: id
   *         required: true
   *       - in: query
   *         name: path
   *     responses:
   *       '200':
   *         description: Returns an object
   *       '400':
   *         description: |
   *                      Returns error when no id is sent
   *
   */
  server.get('/object/open',
    routeBrowse(async function (req, res, next) {
        try {
          if (req.query.id && req.query.path) {
            req.query.id = decodeURIComponent(req.query.id);
            req.query.path = decodeURIComponent(req.query.path);
            await getRecordItem({ req, res, next, configuration, passthrough: false, repository });
          } else if (req.query.id) {
            await getResolveParts({ req, res, next, configuration, select: [ 'parts' ], repository });
          } else {
            res.status(400);
            res.json({ message: 'id parameter value is required' });
            next();
          }
        } catch (e) {
          log.error(e);
          res.status(500);
          res.json({ error: e['message'] });
          next();
        }
      })
  )
}


