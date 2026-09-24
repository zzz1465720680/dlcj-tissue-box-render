# Runtime snapshot notice

These four compiled assets came from `backups/netlify-production-2026-09-24.zip` inside the repository backup supplied by the user. They are not newly downloaded dependencies and are not a reconstructed substitute renderer. The original snapshot is retained byte-for-byte here; `manifest.json` records its SHA-256 values.

The offline builder recompiles the changed application TSX, removes the old root bootstrap, exposes narrowly scoped module bridges, and localizes UI strings in the original ProductView/image-loading functions. It does not change the original mesh, material assets, preset definitions or serialized design schema. The compiled outputs also contain code from the older application that is not mounted by the new entry point.

The byte-identical runtime originals retain their embedded upstream notices. No new licence is granted or implied for original project assets or third-party software. Consult the project dependencies/upstream licensing before redistributing beyond the intended project.

This compatibility path is bound to the exact uploaded snapshot and guarded source hashes. It is not a general bundler, dependency update, full type check or Vite production build. Use the standard locked-dependency build for ongoing development. `dist/BUILD-INFO.json` intentionally records `standardViteBuildVerified: false`.
