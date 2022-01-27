const path = require('path');
const util = require('util')

function workingPath(currentPath) {
  if (path.isAbsolute(currentPath)) {
    return currentPath;
  } else {
    return path.join(process.cwd(), currentPath);
  }
}

function inspect(obj, depth = null) {

  console.log(
    util.inspect(obj, { showHidden: false, depth, colors: true })
  );

}

module.exports = {
  workingPath,
  inspect
}
