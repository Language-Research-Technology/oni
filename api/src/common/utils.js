import * as path from "path";

export function workingPath(currentPath) {
    if (path.isAbsolute(currentPath)) {
        return currentPath;
    } else {
        return path.join(process.cwd(), currentPath);
    }
}
