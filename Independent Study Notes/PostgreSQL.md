PostgreSQL (often called "Postgres") is an open-source, object-relational database system. It's know for:
- Standards compliance -> follows SQL standard more closely than almost any other database
- Extensibility -> custom types, functions, operators, entire languages
- Reliability -> ACID-compliant transactions, crash recovery, write-ahead logging

### UUID Primary Keys
UUID Primary keys are 16 byte, non-human-readable IDs that can be generated for rows in Postgres. There are a few reasons to use these instead of auto-incrementing integers:
- No central coordinator -> UUIDs can be generated anywhere (client, server, worker) without risk of conflicts
- Security -> Auto-increment IDs are guessable, UUIDs aren't
- Merging -> If merging from multiple databases, UUIDs won't conflict
##### Extensions
You can add extensions (basically plugins) to Postgres. For example, you can enable UUID generation with: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

### Triggers and Functions - Automating the Database
**Triggers** are specifications that the database should automatically execute a particular function whenever a certain type of operation is performed. They can be made to happen before any INSERT, UPDATE, or DELETE. These functions are called **Trigger Functions**. The function must be defined before a trigger is made. Triggers can be **per-row** (runs for each row affected by statement) or **per-statement** (runs once per statement). They can also be **before triggers** or **after triggers**.

|            | Stament-level                        | Row-level                                                       |
| ---------- | ------------------------------------ | --------------------------------------------------------------- |
| **Before** | Fires before statement does anything | Fires before a particular row is operated on                    |
| **After**  | Fires at very end of statement       | Fires at end of statement (but before statement-level triggers) |
Let's look at two examples:
```
CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
  END;
  $$ language 'plpgsql';
```

```
CREATE TRIGGER update_groups_updated_at
      BEFORE UPDATE ON public.groups
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
```
Here's what's happening:
- CREATE FUNCTION -> defines reusable logic written in PL/pgSQL (Postgres's built-in procedural language)
- RETURNS TRIGGER -> this function is designed to be called by a trigger
- NEW -> special variable referring to the row being inserted/updated
- BEFORE UPDATE -> fires before update is written, letting you modify data
- FOR EACH ROW -> fires once per *row* being changed (not per statement)


#### The TIMESTAMPTZ Type
TIMESTAMPTZ means "timestamp with time zone." Postgres stores it internally as UTC and converts it to the client's time zone on retrieval.  This is important for this project since friends might be in different time zones. 
Example: `created_at TIMESTAMPZ DEFUALT NOW() NOT NULL`


#### The Partial Unique Index
Only indexes where handle isn't NULL will be given an index. This means that multiple users can have NULL handles (haven't set one during onboarding). However, if handle is set it must be unique.


### RLS Policies

