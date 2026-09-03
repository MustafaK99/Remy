(() => {
  const abortKey = "remy-webmcp-mock-aborts";
  const active = new Set();
  const tools = new Map();
  const mock = {
    active,
    tools,
    registered: [],
    aborted: Number(localStorage.getItem(abortKey) ?? "0"),
    async call(name, input = {}) {
      const tool = tools.get(name);
      if (!tool) throw new Error(`No WebMCP tool named ${name} is registered.`);
      return tool.execute(input);
    },
  };
  globalThis.__remyWebMCP = mock;

  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: {
      registerTool(tool, options) {
        mock.registered.push(tool.name);
        active.add(tool.name);
        tools.set(tool.name, tool);
        options?.signal?.addEventListener(
          "abort",
          () => {
            active.delete(tool.name);
            if (tools.get(tool.name) === tool) tools.delete(tool.name);
            const next = Number(localStorage.getItem(abortKey) ?? "0") + 1;
            localStorage.setItem(abortKey, String(next));
            mock.aborted = next;
          },
          { once: true },
        );
      },
    },
  });
})();
