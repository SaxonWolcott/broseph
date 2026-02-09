Packages are libraries other people have published ([[React]], [[NestJS]], etc.). Package Managers do three main things:

1. Downloads packages from the npm registry
2. Tracks which packages and versions your project needs ( in `package.json`)
3. Resolves dependencies -- if Package A needs Package B which needs Package C, it figures that out

### npm and pnpm
npm, or the Node Package Manager, is [[Node.js]]'s built in package manager. pnpm (Performant npm) is an alternative that's faster since it stores every package once in a global cache on your computer. That means if two project both use react, pnpm shares one copy rather than downloading it twice.