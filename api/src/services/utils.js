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
  const ins = util.inspect(obj, {showHidden: false, depth, colors: true})
  console.log(ins);
}

module.exports = {
  workingPath,
  inspect
}
