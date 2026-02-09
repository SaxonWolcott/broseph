ECMAScript Modules (ESM) are the official, standardized system for organizing JavaScript code into reusable, self-contained components. It uses three rules:
1. Each file has its own isolated scope -- nothing leaks out unless you say so
2. `export` -> marks what a file makes available to others
3. `import` -> pulls in what you need from another file

```
// file: math.ts — exports two things
export function add(a: number, b: number) { return a + b; }
export const PI = 3.14159;

// file: app.ts — imports only what it needs
import { add } from './math';
add(2, 3); // works
PI;         // error — wasn't imported
```

You'll also see `export default` which is shorthand for a file that primarily exports one thing.

```
// file: Button.tsx
export default function Button() { return <button>Click</button>; }

// file: Page.tsx — no curly braces needed for default imports
import Button from './Button';
```

Named exports are generally preferred over default exports because your IDE can autocomplete them. Also, if you rename something, everything breaks which is good because you instantly know what the issue it. Default exports have no name so they can be silently imported as anything.

### Re-exports (Barrel Pattern)
In order to manage imports and exports, the barrel pattern is used. This is done with the use of an `index.ts` file that exports many things at once. It essentially brings all the exports together so they can be accessed from a single point.

Sample `index.ts`
```
// Constants
export * from './constants/limits';
export * from './constants/sample-prompts';

// Enums
export * from './enums/error-codes.enum';

// DTOs
export * from './dto/base.dto';
export * from './dto/auth.dto';
export * from './dto/groups.dto';
export * from './dto/messages.dto';
export * from './dto/invites.dto';
export * from './dto/prompts.dto';
export * from './dto/jobs';
```

Sample import
```
import { SupabaseModule } from '@app/shared';
```