module.exports = {
    verbose: true,
    rootDir: "src",
    testMatch: ["**/*.spec.js"],
    testPathIgnorePatterns: ["node_modules"],
    watchPathIgnorePatterns: ["\\**/.*(?<!spec).js"],
    moduleNameMapper: {
        "jose(.*)": "<rootDir>/../node_modules/jose/dist/node/cjs/$1.js",
    },
};
