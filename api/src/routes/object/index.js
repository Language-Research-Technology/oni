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
   *                  ### Gets objects in a variety of combinations
   *                  ### Examples:
   *                  - memberOf=id&conformsTo=Collection/Object/ -> Get members of an ID that conforms to a collection
   *                  - memberOf=id -> get all the children of id
   *                  - memberOf=null -> (ie top-level) Get ALL objects which are not part of ANY collection
   *                  - memberOf=null&conformsTo=collectionProfileURI -> All TOP level collections
   *                  - id=<<ID>>&memberOfTopLevel -> get the records top level
   *                  - id=<<ID>> -> get a single record
   *                  - no params -> get all root ConformsTos paginated
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - in: path
   *         name: memberOf
   *         description: Member Of
   *       - in: path
   *         name: conformsTo
   *         description: Conforms To
   *       - in: path
   *         name: crateId
   *         description: .
   *       - in: path
   *         name: id
   *         description: .
   *       - in: path
   *         name: offset
   *       - in: path
   *         name: limit
   *     responses:
   *       '200':
   *         description: .
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
      await getRecordMemberOfTop({req, res, next});
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
   *     description: Object Meta
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - in: query
   *         name: id
   *         description: object id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: resolve-parts
   *       - in: query
   *         name: types
   *       - in: query
   *         name: members
   *       - in: query
   *         name: memberOf
   *       - in: query
   *         name: noUrid
   *         schema:
   *           type: boolean
   *       - in: query
   *         name: version
   *       - in: query
   *         name: raw
   *       - in: query
   *         name: zip
   *         description: NOT IMPLEMENTED
   *     responses:
   *       '200':
   *         description: .
   */
  server.get('/object/meta', async (req, res, next) => {
    if (req.query.id) {
      if (!isUndefined(req.query.types)) {
        await getRecordTypes({ req, res, next });
      } else if (!isUndefined(req.query.members)) {
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
   *     description: Object Meta Versions, NOT IMPLEMENTED
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - in: query
   *         name: id
   *         description: ocfl version id
   *     responses:
   *       '200':
   *         description: .
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
   *     description: Stream File
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
   *         description: Streams file requested
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
   *     description: Open Object
   *     security:
   *      - Bearer: []
   *     parameters:
   *       - in: query
   *         name: id
   *       - in: query
   *         name: path
   *     responses:
   *       '200':
   *         description: .
   *       '400':
   *         description: Returns error when no id is sent
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


