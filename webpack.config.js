const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackInlineSVGPlugin = require("html-webpack-inline-svg-plugin");
const ExtraWatchWebpackPlugin = require("extra-watch-webpack-plugin");

module.exports = env => {
  const isProd = env === "prod";

  const plugins = [
    new HtmlWebpackPlugin({
      template: "src/index.html",
      minify: {
        removeComments: true,
        removeAttributeQuotes: true,
        removeScriptTypeAttributes: true,
        removeTagWhitespace: true,
        collapseWhitespace: true,
        minifyCSS: true,
      },
    }),
    new HtmlWebpackInlineSVGPlugin({
      runPreEmit: true,
      convertPathData: false,
      convertTransform: false,
      cleanupNumericValues: false,
      convertShapeToPath: false,
      transformsWithOnePath: false,
      removeDimensions: false,
      removeAttrs: false,
      cleanupAttrs: false,
      convertColors: false,
      removeUnusedNS: false,
    }),
    new ExtraWatchWebpackPlugin({
      files: ["levels/*.svg"],
    }),
  ];

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
