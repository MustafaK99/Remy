#!/usr/bin/env node

console.error(`
Remy's one-call initializer is not available in this release.

The required @remy-ai packages have not been published, so this command will
not create files or install dependencies. Run the working source instead:

  git clone https://github.com/MustafaK99/Remy.git
  cd Remy
  npm ci
  npm run dev

See ROADMAP.md for the package and CLI release plan.
`);

process.exitCode = 1;
