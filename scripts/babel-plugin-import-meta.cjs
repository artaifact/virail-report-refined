module.exports = function () {
  return {
    visitor: {
      MetaProperty(path) {
        if (path.node.meta && path.node.meta.name === 'import' && path.node.property && path.node.property.name === 'meta') {
          path.replaceWithSourceString(
            '({ env: { ...process.env, DEV: process.env.NODE_ENV !== "production", PROD: process.env.NODE_ENV === "production", MODE: process.env.NODE_ENV || "test", VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || "http://localhost:8000" } })'
          );
        }
      },
    },
  };
};
