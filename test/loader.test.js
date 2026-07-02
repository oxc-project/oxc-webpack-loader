import { describe, it, expect } from "vite-plus/test";
import { createRequire } from "module";
import path from "path";
import fs from "fs";
import os from "os";
import webpack from "webpack";

const require = createRequire(import.meta.url);
const makeLoader = require("../src/index.js").custom;

function readOutputFiles(outputDir) {
  const files = {};
  for (const file of fs.readdirSync(outputDir)) {
    files[file] = fs.readFileSync(path.join(outputDir, file), "utf-8");
  }
  return files;
}

function compile(entry, loaderOptions = {}, webpackOptions = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "oxc-loader-test-"));
  const compiler = webpack({
    mode: "none",
    entry,
    output: {
      path: tmpDir,
      filename: "bundle.js",
    },
    externals: [/^react/, /^@oxc-project\//],
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          use: {
            loader: path.resolve(__dirname, "../src/index.js"),
            options: loaderOptions,
          },
        },
      ],
    },
    ...webpackOptions,
  });

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      let error = err;
      let files;

      try {
        if (!error && stats.hasErrors()) {
          error = new Error(stats.compilation.errors.map((e) => e.message).join("\n"));
        }
        if (!error) {
          files = readOutputFiles(tmpDir);
        }
      } catch (readError) {
        error = readError;
      }

      compiler.close((closeError) => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        if (error || closeError) {
          reject(error || closeError);
          return;
        }
        resolve(files);
      });
    });
  });
}

function runLoader(
  source,
  { filename = "input.js", getOptions, mode = "none", options = {}, sourceMap = false } = {},
) {
  return new Promise((resolve, reject) => {
    const loaderContext = {
      async() {
        return (error, code, map) => {
          if (error) {
            reject(error);
            return;
          }
          resolve({ code, map });
        };
      },
      mode,
      resourcePath: path.join(__dirname, "fixtures", filename),
      sourceMap,
    };

    if (getOptions !== false) {
      loaderContext.getOptions = () => options;
    }

    makeLoader().call(loaderContext, source);
  });
}

describe("oxc-loader", () => {
  it("transforms a basic JS file", async () => {
    const files = await compile(path.join(__dirname, "fixtures", "basic.js"));
    expect(files["bundle.js"]).toContain("console.log");
  });

  it("transforms JSX with classic runtime", async () => {
    const files = await compile(path.join(__dirname, "fixtures", "jsx.jsx"), {
      jsx: {
        runtime: "classic",
        pragma: "React.createElement",
        pragmaFrag: "React.Fragment",
      },
    });
    expect(files["bundle.js"]).toContain(".createElement(");
    expect(files["bundle.js"]).not.toContain("<h1>");
  });

  it("transforms JSX with automatic runtime", async () => {
    const files = await compile(path.join(__dirname, "fixtures", "jsx.jsx"), {
      jsx: {
        runtime: "automatic",
      },
    });
    expect(files["bundle.js"]).toContain("react/jsx-runtime");
    expect(files["bundle.js"]).not.toContain("<h1>");
  });

  it("transforms TypeScript", async () => {
    const files = await compile(path.join(__dirname, "fixtures", "typescript.ts"));
    expect(files["bundle.js"]).not.toContain(": string");
    expect(files["bundle.js"]).not.toContain(": number");
    expect(files["bundle.js"]).toContain("greet");
  });

  it("transforms TSX", async () => {
    const files = await compile(path.join(__dirname, "fixtures", "typescript-jsx.tsx"), {
      jsx: {
        runtime: "automatic",
      },
    });
    expect(files["bundle.js"]).toContain("react/jsx-runtime");
    expect(files["bundle.js"]).not.toContain(": Props");
    expect(files["bundle.js"]).not.toContain("<div>");
  });

  it("transforms TypeScript and TSX together in one build", async () => {
    const files = await compile(
      [
        path.join(__dirname, "fixtures", "typescript.ts"),
        path.join(__dirname, "fixtures", "typescript-jsx.tsx"),
      ],
      {
        jsx: {
          runtime: "automatic",
        },
      },
    );
    expect(files["bundle.js"]).toContain("greet");
    expect(files["bundle.js"]).toContain("react/jsx-runtime");
    expect(files["bundle.js"]).not.toContain(": string");
    expect(files["bundle.js"]).not.toContain(": number");
    expect(files["bundle.js"]).not.toContain(": Props");
    expect(files["bundle.js"]).not.toContain("<div>");
  });

  it("generates source maps when enabled", async () => {
    const files = await compile(
      path.join(__dirname, "fixtures", "basic.js"),
      { sourcemap: true },
      { devtool: "source-map" },
    );
    expect(files["bundle.js.map"]).toBeDefined();
    const sourceMap = JSON.parse(files["bundle.js.map"]);
    expect(sourceMap.version).toBe(3);
  });

  it("works in sync mode", async () => {
    const files = await compile(path.join(__dirname, "fixtures", "basic.js"), { sync: true });
    expect(files["bundle.js"]).toContain("console.log");
  });

  it("targets a specific ES version", async () => {
    const files = await compile(path.join(__dirname, "fixtures", "es-target.js"), {
      target: "es2015",
    });
    expect(files["bundle.js"]).not.toContain("...");
  });

  it("auto-detects JSX development mode", async () => {
    const files = await compile(
      path.join(__dirname, "fixtures", "jsx.jsx"),
      {
        jsx: {
          runtime: "automatic",
        },
      },
      { mode: "development" },
    );
    expect(files["bundle.js"]).toContain("jsx-dev-runtime");
  });

  it("does not override an explicit JSX development option", async () => {
    const { code } = await runLoader("const element = <span />;", {
      filename: "component.js",
      mode: "development",
      options: {
        jsx: {
          development: false,
          runtime: "automatic",
        },
      },
    });

    expect(code).toContain("react/jsx-runtime");
    expect(code).not.toContain("react/jsx-dev-runtime");
  });

  it("enables source maps from webpack's sourceMap flag", async () => {
    const { map } = await runLoader('console.log("mapped");', {
      sourceMap: true,
    });

    expect(map).toBeDefined();
    expect(map.version).toBe(3);
  });

  it("lets loader sourcemap options override webpack's sourceMap flag", async () => {
    const { map } = await runLoader('console.log("unmapped");', {
      options: {
        sourcemap: false,
      },
      sourceMap: true,
    });

    expect(map).toBeUndefined();
  });

  it("works when webpack does not expose getOptions", async () => {
    const { code } = await runLoader('console.log("fallback");', {
      getOptions: false,
    });

    expect(code).toContain("fallback");
  });

  it("reports transform errors through the webpack callback", async () => {
    await expect(runLoader("const value = ;")).rejects.toThrow("Unexpected");
  });
});
