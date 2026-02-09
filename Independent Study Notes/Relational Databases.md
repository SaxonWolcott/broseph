Refer to your class!!

Relational Databases store data in tables. Each table has fields (columns) and records (rows). "Relational" means that tables can reference each other. To talk to the database — create tables, inset data, and query it back — you use [[SQL]].

Here are some example tables in the project:

| Table          | What it stores       | Example row                                              |
| -------------- | -------------------- | -------------------------------------------------------- |
| profiles       | User info            | id: abc, display_name: "John", handle: "johndoe"         |
| groups         | Chat groups          | id: xyz, name: "College Friends", owner_id: abc          |
| group_memebers | Who's in which group | group_id: xyz, user_id: abc, role: "owner"               |
| messages       | Chat messages        | group_id: xyz, sender_id: abc, content: "Hey!"           |
| group_invites  | Invite links         | group_id: xyz, invite_token: "f7a3b...", expires_at: ... |
#### Indexes:
Indexes allow you to find specific rows without having to sort through every row. it's like a sorted lookup table. It is automatically maintained by the database. 

