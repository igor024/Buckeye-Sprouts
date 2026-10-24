import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadWorker(filename, initialCaches = []) {
  const listeners = new Map();
  const stores = new Map(initialCaches.map((name) => [name, new Map()]));
  const lifecycle = [];
  const origin = "https://buckeye.example";
  const normalize = (request) => new URL(typeof request === "string" ? request : request.url, origin).href;
  let online = true;
  const caches = {
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return { async put(request, response) { store.set(normalize(request), response); } };
    },
    async match(request) {
      for (const store of stores.values()) {
        const response = store.get(normalize(request));
        if (response) return response.clone();
      }
    },
  };
  vm.runInNewContext(readFileSync(new URL(`../public/${filename}`, import.meta.url), "utf8"), {
    URL, Response, console, caches,
    async fetch(request) {
      if (!online) throw new Error("Offline");
      return new Response(`Network: ${normalize(request)}`);
    },
    self: {
      location: { href: `${origin}/hackohio2026/sw.js`, origin },
      registration: { scope: `${origin}/hackohio2026/`, async unregister() { lifecycle.push("unregister"); } },
      clients: { async claim() { lifecycle.push("claim"); } },
      async skipWaiting() { lifecycle.push("skipWaiting"); },
      addEventListener(type, handler) { listeners.set(type, handler); },
    },
  }, { filename });
  return {
    caches, lifecycle, listeners,
    goOffline() { online = false; },
    async dispatch(type, request) {
      const waiting = [];
      let response;
      listeners.get(type)?.({
        request,
        waitUntil(promise) { waiting.push(promise); },
        respondWith(promise) { response = promise; },
      });
      await Promise.all(waiting);
      return response;
    },
    request(path, mode = "cors") { return { url: `${origin}${path}`, method: "GET", mode }; },
  };
}

// An installed worker must relinquish control, not just unregister while its old
// fetch handler continues serving stale bundles to already-open development tabs.
const development = loadWorker("sw-dev.js", ["buckeyestudy-v6", "buckeyestudy-v7", "unrelated-app-cache"]);
await development.dispatch("install");
await development.dispatch("activate");
assert.deepEqual(await development.caches.keys(), ["unrelated-app-cache"]);
assert.deepEqual(development.lifecycle, ["skipWaiting", "claim", "unregister"]);
assert.equal(development.listeners.has("fetch"), false, "Development requests must reach the network");

const cleanDevelopment = loadWorker("sw-dev.js");
await cleanDevelopment.dispatch("activate");
assert.deepEqual(cleanDevelopment.lifecycle, ["claim", "unregister"]);

// Local production previews and subpath deployments must retain real offline
// behavior, including the Level 1 floor plan and a dedicated HTML fallback.
const production = loadWorker("sw.js");
await production.dispatch("install");
production.goOffline();
const plan = await production.dispatch("fetch", production.request("/hackohio2026/maps/floor-1-map.svg"));
assert.equal(plan.status, 200);
assert.match(await plan.text(), /maps\/floor-1-map\.svg$/);
const navigation = await production.dispatch("fetch", production.request("/hackohio2026/uncached-page", "navigate"));
assert.equal(navigation.status, 200);
assert.match(await navigation.text(), /\/hackohio2026\/offline$/);
const api = await production.dispatch("fetch", production.request("/hackohio2026/api/sessions"));
assert.equal(api.status, 503);
assert.equal((await api.json()).error.code, "OFFLINE");

console.log("Service worker checks passed: development retirement, scoped cache cleanup, network bypass, production offline floor plan, navigation fallback and API response.");
