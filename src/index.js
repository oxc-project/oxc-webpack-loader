const { transform, transformSync } = require("oxc-transform");

function makeLoader() {
  return function (source, inputSourceMap) {
    const callback = this.async();
    const filename = this.resourcePath;

    let loaderOptions =
      (typeof this.getOptions === "function" ? this.getOptions() : {}) || {};

    const sourceMaps =
      loaderOptions.sourcemap === undefined
        ? this.sourceMap
        : loaderOptions.sourcemap;

    const transformOptions = Object.assign({}, loaderOptions, {
      sourcemap: !!sourceMaps,
    });

    // Auto detect development mode for JSX
    if (
      this.mode &&
      transformOptions.jsx &&
      typeof transformOptions.jsx === "object" &&
      !Object.prototype.hasOwnProperty.call(transformOptions.jsx, "development")
    ) {
      transformOptions.jsx = Object.assign({}, transformOptions.jsx, {
        development: this.mode === "development",
      });
    }

    // Remove loader-specific options
    const sync = transformOptions.sync;
    delete transformOptions.sync;

    try {
      if (sync) {
        const output = transformSync(filename, source, transformOptions);
        if (output.errors.length > 0) {
          callback(new Error(output.errors.map((e) => e.message).join("\n")));
          return;
        }
        callback(null, output.code, output.map ?? undefined);
      } else {
        transform(filename, source, transformOptions).then(
          (output) => {
            if (output.errors.length > 0) {
              callback(
                new Error(output.errors.map((e) => e.message).join("\n"))
              );
              return;
            }
            callback(null, output.code, output.map ?? undefined);
          },
          (err) => {
            callback(err);
          }
        );
      }
    } catch (e) {
      callback(e);
    }
  };
}

module.exports = makeLoader();
module.exports.custom = makeLoader;
