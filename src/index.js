const { transform, transformSync } = require("oxc-transform");

function getLoaderOptions(loaderContext) {
  if (typeof loaderContext.getOptions !== "function") {
    return {};
  }
  return loaderContext.getOptions() || {};
}

function shouldUseSourceMap(loaderContext, loaderOptions) {
  return loaderOptions.sourcemap === undefined
    ? !!loaderContext.sourceMap
    : !!loaderOptions.sourcemap;
}

function getTransformOptions(loaderContext, filename) {
  const loaderOptions = getLoaderOptions(loaderContext);
  const { sync = false, ...transformOptions } = loaderOptions;

  transformOptions.sourcemap = shouldUseSourceMap(loaderContext, loaderOptions);

  if (
    loaderContext.mode &&
    transformOptions.jsx &&
    typeof transformOptions.jsx === "object" &&
    !Object.prototype.hasOwnProperty.call(transformOptions.jsx, "development")
  ) {
    transformOptions.jsx = {
      ...transformOptions.jsx,
      development: loaderContext.mode === "development",
    };
  }

  if (!transformOptions.lang && transformOptions.jsx && filename.endsWith(".js")) {
    transformOptions.lang = "jsx";
  }

  return { sync, transformOptions };
}

function createTransformError(errors) {
  return new Error(errors.map((error) => error.message).join("\n"));
}

function handleTransformResult(callback, output) {
  if (output.errors.length > 0) {
    callback(createTransformError(output.errors));
    return;
  }
  callback(null, output.code, output.map ?? undefined);
}

function makeLoader() {
  return function (source, _inputSourceMap) {
    const callback = this.async();
    const filename = this.resourcePath;
    const { sync, transformOptions } = getTransformOptions(this, filename);

    try {
      if (sync) {
        const output = transformSync(filename, source, transformOptions);
        handleTransformResult(callback, output);
      } else {
        transform(filename, source, transformOptions).then(
          (output) => {
            handleTransformResult(callback, output);
          },
          (err) => {
            callback(err);
          },
        );
      }
    } catch (e) {
      callback(e);
    }
  };
}

module.exports = makeLoader();
module.exports.custom = makeLoader;
