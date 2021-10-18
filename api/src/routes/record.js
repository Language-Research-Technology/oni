import {getRecords} from "../lib/record";

export function setupRoutes({server}) {
    server.get("/data", async (req, res, next) => {
        let users = await getRecords({
            offset: req.query.offset,
            limit: req.query.limit,
        });
        res.send(users);
        next();
    });
}
