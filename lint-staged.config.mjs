// lint-staged config for brain.
//
// check-area-docs scans area dirs itself; just run it once when any
// workspace/areas/** file is staged.
export default {
  "workspace/areas/**": (files) => {
    return files.length > 0 ? ["bun scripts/check-area-docs.ts"] : [];
  },
};
