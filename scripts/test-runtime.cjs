// tsx asks node:os for the current user while choosing a temporary directory.
// In restricted Windows runners that lookup can fail before any test starts.
// Supplying the Unix-compatible process hook keeps the directory deterministic
// and has no effect on application/runtime code.
if (typeof process.geteuid !== "function") {
  Object.defineProperty(process, "geteuid", {
    configurable: true,
    value: () => 0,
  });
}
