Node.js is a JavaScript runtime environment that allows JavaScript to be run outside of a web browser, which was its original home. This is important because it allows you to use the same language for frontend and backend. Node.js also comes with a built in [[Packages & Package Managers|Package Manager]] called npm.

This project uses Node.js in three ways:

| Process             | What it does                                   | Port |
| ------------------- | ---------------------------------------------- | ---- |
| [[API]] server      | [[NestJS]] handling [[HTTP]] requests          | 3000 |
| Worker              | Processing background jobs from [[Redis]]      | -    |
| [[Vite]] dev server | Serving the [[React]] frontend with hot reload | 5173 |

### Manifests
A manifest file contains metadata about the project such as its name, author, version-details, description and details about its components. It also list dependencies (along with their versions), test-scripts, automation setting, system-configuration and more. It acts as blueprint of a project.

In Node.js, the manifest is `package.json`, shown here:
```
{
  "name": "broseph",
  "version": "0.1.0",
  "private": true,
  "description": "A group messaging app designed to help friends stay in touch",
  "scripts": {
    "dev": "concurrently \"pnpm dev:api\" \"pnpm dev:worker\" \"pnpm dev:web\"",
    "dev:api": "pnpm --filter backend dev:api",
    "dev:worker": "pnpm --filter backend dev:worker",
    "dev:web": "pnpm --filter frontend dev",
    "build": "pnpm --filter backend build && pnpm --filter frontend build",
    "typecheck": "pnpm --filter backend typecheck && pnpm --filter frontend
	    typecheck",
    "lint": "pnpm --filter backend lint && pnpm --filter frontend lint",
    "test": "pnpm --filter backend test"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

| Section           | Meaning                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts`         | custom terminal commands (e.g. `pnpm dev`)                                                                                            |
| `dev...`          | "concurrently" is a tool that runs multiple commands in parallel. Therefore, `pnpm dev` starts API, Worker, and Frontend all at once. |
| `--filter`        | Used to target a specific workspace. E.g. `pnpm --filter backend dev:api` -> "go into backend workspace and run its dev:api script"   |
| `devDependencies` | Packages needed only during development. Don't ship to production                                                                     |
| `engines`         | declares this project requires Node.js 20 or higher                                                                                   |
### Workspaces (Monorepo)
This project is contained in a **monorepo** — one repo containing multiple packages. The benefit of this is that API and Worker both have access to the same information. They both know what a `SendMessageDto` looks like for the same copy, as opposed to defining it twice and risking a desync. The barrel file works in both apps.