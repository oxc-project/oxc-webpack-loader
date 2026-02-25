"use strict";

const path = require("path");

module.exports = {
  mode: "development",
  devtool: "source-map",
  entry: path.join(__dirname, "src", "index.js"),
  output: {
    path: path.join(__dirname, "build"),
    filename: "bundle.js",
  },
  devServer: {
    static: path.join(__dirname, "public"),
    port: 3000,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: require.resolve(".."), // you would put oxc-loader
          options: {
            sourcemap: true,
            jsx: {
              runtime: "automatic",
            },
          },
        },
      },
    ],
  },
};
