module.exports = {
    resolve: {
        modulesDirectories: ["web_modules"]
    },
    entry: "./entry.js",
    output: {
        path: __dirname,
        filename: "bundle.js"
    },
    module: {
        loaders: [

        ]
    }
};
