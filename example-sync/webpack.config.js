"use strict";

const path = require("path");

module.exports = {
  mode: "development",
  entry: path.join(__dirname, "index.js"),
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
            sync: true,
            jsx: {
              runtime: "automatic",
            },
          },
        },
      },
    ],
  },
};
