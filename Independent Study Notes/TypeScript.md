TypeScript is a **strongly typed** variant of JavaScript. This means that data types must be explicitly declared, implicit, unsafe type conversions aren't possible, and it uses **compile time checking**.

### Interfaces:
An interface defines the shape of an object. Here is an example in the project:
```
export interface MessageSender {
	id: string;
	displayName: string | null;
	handle: string | null;
	avatarUrl: string | null;
}

export interface Message {
	id: string;
	groupId: string;
	sender: MessageSender | null;
	content: string;
	createdAt: string;
	type?: 'message' | 'system';
	pending?: boolean;
	error?: boolean;
}
```

- `id: string;` -> id must be a string
- `sender: MessageSender | null;` -> sender is a Message Sender or null
- `type?: 'message' | 'system'` -> ? means that field is optional. If it does, should only equal  'message' or 'system'
- `pending?: boolean` -> used for [[optimistic updates]]


### Decorators:
A Decorator is a special annotation that attaches [[Metadata]] to a class or property. It's essentially a label that says "this field has these rules." They're read by [[NestJS]] at runtime.

```
// FROM backend/libs/shared/src/dto/messages.dto.ts:17-27:

export class SendMessageDto {
	@ApiProperty({
		example: 'Hello everyone!',
		description: 'Message content',
		maxLength: LIMITS.MAX_MESSAGE_LENGTH,
	})
	@IsString()
	@MinLength(1)
	@MaxLength(LIMITS.MAX_MESSAGE_LENGTH)
	content!: string;
}
```

- `@IsString()` -> reject request if content isn't a string
- `@MaxLength(LIMITS.MAX_MESSAGE_LENGTH)` -> reject if too long
- `@ApiProperty({...` -> generate [[Swagger]] documentation automatically
- `content!: string` -> ! means assignment assertion, "trust me, there will be an assigned value"

### Configuring the Compiler
The file `backend/tsconfig.json` is used to configure the TypeScript compiler. Here are some key settings:

| Setting                             | What it does                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `"strict": true`                    | Enables all strict type-checking -- highest safety                              |
| `"noImplicitAny": true`             | Every variable must have known type                                             |
| `experimentalDecorators: true`      | Enablers @decorator syntax [[NestJS]] needs                                     |
| `"paths": { "@app/shared": [...] }` | Creates import shortcut so import {X} from '@app/shared' maps to shared library |
| `"target": "ES2022"`                | Compiles TypeScript down to ES2022 JavaScript                                   |
#### Exporting
The `export` keywork is used to make things like functions, interfaces, classes, and constants available to other files. This is used a lot because most of the `.ts` files are creating things to be used elsewhere. This is important for the [[ES Modules System]].