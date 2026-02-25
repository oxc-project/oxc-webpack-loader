import { describe, it, expect } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";
import webpack from "webpack";

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
      if (err) {
        reject(err);
        return;
      }
      if (stats.hasErrors()) {
        reject(new Error(stats.compilation.errors.map((e) => e.message).join("\n")));
        return;
      }
      const files = {};
      for (const file of fs.readdirSync(tmpDir)) {
        files[file] = fs.readFileSync(path.join(tmpDir, file), "utf-8");
      }
      fs.rmSync(tmpDir, { recursive: true });
      resolve(files);
    });
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
});
