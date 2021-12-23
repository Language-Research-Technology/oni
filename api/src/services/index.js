module.exports = {
  loadConfiguration: require("./configuration").loadConfiguration,
  filterPrivateInformation: require("./configuration").filterPrivateInformation,
  getLogger: require('./logger').getLogger,
  routeUser: require('../middleware/auth').routeUser,
  generateToken: require('./jwt').generateToken,
  verifyToken: require('./jwt').verifyToken,
  setupBeforeAll: require('./test-utils').setupBeforeAll,
  setupBeforeEach: require('./test-utils').setupBeforeEach,
  teardownAfterAll: require('./test-utils').teardownAfterAll,
  teardownAfterEach: require('./test-utils').teardownAfterEach,
  testOCFLConf: require('./test-utils').testOCFLConf,
  testHost: require('./test-utils').testHost,
  testLicense: require('./test-utils').testLicense,
  testIdentifier: require('./test-utils').testIdentifier,
  testCreate: require('./test-utils').testCreate
}
