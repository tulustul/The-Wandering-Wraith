const path = require("path");

const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = env => {
  const isProd = env === "prod";

  const filesToCopy = ["src/index.html"];

  const plugins = [new CopyWebpackPlugin(filesToCopy)];

  return {
    entry: "./src/index.ts",
    module: {
      rules: [
        {
          test: /\.ts?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "dist"),
    },
    plugins: plugins,
    devtool: isProd ? false : "source-map",
  };
};
