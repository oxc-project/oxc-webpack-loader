<p align="center">
  <br>
  <br>
  <a href="https://oxc.rs" target="_blank" rel="noopener noreferrer">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://oxc.rs/oxc-light.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://oxc.rs/oxc-dark.svg">
      <img alt="Oxc logo" src="https://oxc.rs/oxc-dark.svg" height="60">
    </picture>
  </a>
  <br>
  <br>
  <br>
</p>

<div align="center">

[![MIT licensed][license-badge]][license-url]
[![Build Status][ci-badge]][ci-url]
[![npm][npm-badge]][npm-url]

[![Discord chat][discord-badge]][discord-url]
[![Website][website-badge]][website-url]

</div>

## oxc-loader

Webpack loader for [oxc-transform](https://npmx.dev/package/oxc-transform). A drop-in replacement for `swc-loader` and `babel-loader` that uses Oxc for fast JavaScript and TypeScript transformation.

## Install

```bash
npm install -D oxc-loader oxc-transform
```

## Usage

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: "oxc-loader",
          options: {
            // oxc-transform options
            // https://npmx.dev/package/oxc-transform
          },
        },
      },
    ],
  },
};
```

### JSX

```js
{
  loader: "oxc-loader",
  options: {
    jsx: {
      runtime: "automatic", // or "classic"
    },
  },
}
```

### TypeScript

TypeScript is supported out of the box. No additional configuration is needed - just include `.ts` and `.tsx` in the `test` pattern.

### Target

```js
{
  loader: "oxc-loader",
  options: {
    target: "es2015",
  },
}
```

### Source Maps

```js
{
  loader: "oxc-loader",
  options: {
    sourcemap: true,
  },
}
```

Source maps are also automatically enabled when webpack's `devtool` option is set.

### Sync Mode

```js
{
  loader: "oxc-loader",
  options: {
    sync: true,
  },
}
```

## Options

All [oxc-transform `TransformOptions`](https://npmx.dev/package/oxc-transform) are supported, plus:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `sync` | `boolean` | `false` | Use `transformSync` instead of `transform`. The async `transform` spawns a thread per call, which can be slower due to overhead. Sync mode runs on the main thread and may be faster for small files. |

## License

Oxc is free and open-source software licensed under the [MIT License](./LICENSE).

[license-badge]: https://img.shields.io/badge/license-MIT-blue.svg
[license-url]: https://github.com/oxc-project/oxc-webpack-loader/blob/main/LICENSE
[ci-badge]: https://github.com/oxc-project/oxc-webpack-loader/actions/workflows/ci.yml/badge.svg?event=push&branch=main
[ci-url]: https://github.com/oxc-project/oxc-webpack-loader/actions/workflows/ci.yml?query=event%3Apush+branch%3Amain
[npm-badge]: https://img.shields.io/npm/v/oxc-loader
[npm-url]: https://npmx.dev/package/oxc-loader
[discord-badge]: https://img.shields.io/discord/1079625926024900739?logo=discord&label=Discord
[discord-url]: https://discord.gg/9uXCAwqQZW
[website-badge]: https://img.shields.io/badge/Website-blue
[website-url]: https://oxc.rs
