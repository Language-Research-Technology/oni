const path = require('path');

function workingPath(currentPath) {
  if (path.isAbsolute(currentPath)) {
    return currentPath;
  } else {
    return path.join(process.cwd(), currentPath);
  }
}

module.exports = {
  workingPath
}
