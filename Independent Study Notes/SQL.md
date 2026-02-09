SQL (Structured Query Language) is the standard language used for managing and manipulating relational databases.

Example in project:
```
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT messages_content_length CHECK (
        char_length(content) >= 1 AND char_length(content) <= 2000
    )
);
```
Let's break it down:
	First two lines:
	- CREATE TABLE -> make a new table called messages
	- id UUID PRIMARY KEY -> every message gets a unique ID. Primary keys are unique identifiers for each row. UUID is randomly generated 128-bit ID
	- DEFAULT uuid_generate_v4() -> if no ID provided, database auto-generates one
	