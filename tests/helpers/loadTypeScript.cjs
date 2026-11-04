const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Isolate each test's modules/storage/fetch while running the actual service code.
function createHarness(fetchHandler) {
  const values = new Map();
  const requests = [];
  const cache = new Map();
  const storage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
    removeItem: async (key) => { values.delete(key); },
  };
  const context = vm.createContext({
    Error, Headers, URLSearchParams, AbortController, setTimeout, clearTimeout,
    process: { env: {} },
    fetch: async (url, options) => {
      requests.push({ url, options });
      return fetchHandler(url, options);
    },
  });
  const root = path.resolve(__dirname, "../..");

  function load(relativePath) {
    const filename = path.resolve(root, relativePath);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const source = fs.readFileSync(filename, "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    });
    const localRequire = (specifier) => {
      if (specifier === "@react-native-async-storage/async-storage") return storage;
      if (specifier.startsWith(".")) return load(path.relative(root, path.resolve(path.dirname(filename), specifier + ".ts")));
      throw new Error(`Unexpected dependency: ${specifier}`);
    };
    const run = vm.runInContext(`(function(require, module, exports) {\n${outputText}\n})`, context, { filename });
    run(localRequire, module, module.exports);
    return module.exports;
  }

  return { load, values, requests };
}

module.exports = { createHarness };
