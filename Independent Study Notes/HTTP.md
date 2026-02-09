HTTP (HyperText Transfer Protocol) is the language of the web. It's used every time your web browser loads a page fetches data, or submits a form. It's a simple request-response conversation. In this project, that conversation consists of:
1. The client ([[React]] app in browser) sends a request
2. The server (your [[NestJS]] API) sends back a response

All requests have for parts:

| Part   | Example                        | Purpose                                                  |
| ------ | ------------------------------ | -------------------------------------------------------- |
| Method | `GET, POST, DELETE`            | What action you want                                     |
| URL    | `/api/groups/abc-123/messages` | Which resource                                           |
| Heads  | `Authorization: Bearer eyJhb`  | Metadata ([[Authentication\|auth tokens]], content type) |
Every response has:

| Part                                                                              | Example                 | Purpose                           |
| --------------------------------------------------------------------------------- | ----------------------- | --------------------------------- |
| [Status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status) | `200, 401, 404`         | Did it work?                      |
| Body                                                                              | `{ "messages": [...] }` | The data you asked for ([[JSON]]) |
#### HTTP Methods — Actions on a resource:

| Method | Meaning                       | Example in Project               |
| ------ | ----------------------------- | -------------------------------- |
| GET    | **Read** data                 | Get all messages in a group chat |
| POST   | **Create** something new      | Send a new message               |
| PUT    | **Update** something existing | Update user profile              |
| DELETE | **Remove** something          | Leave a group                    |
