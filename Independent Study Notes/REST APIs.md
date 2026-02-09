REST (Representational State Transfer) is a design pattern for structuring [[APIs]] around resources (nouns rather than verbs).

Let's use the groups controller as an example (`\backend\apps\api\src\groups\groups.controller.ts`):### Controller:
The controller is designated with the `@Controller(...)` [[Decorators|decorator]]. In this case `@Controller('api/groups')` means all endpoints start with /api/groups. Each method ads onto that URL.

| Line | Decorator      | Full URL                   | Method | Action                 |
| ---- | -------------- | -------------------------- | ------ | ---------------------- |
| 52   | @Post()        | POST /api/groups           | POST   | Create a new group     |
| 83   | @Get()         | GET /api/groups            | GET    | List all your groups   |
| 98   | @Get(':id')    | GET /api/groups/abc-123    | GET    | Get one specific group |
| 116  | @Delete(':id') | DELETE /api/groups/abc-123 | DELETE | Delete a group         |
This shows the REST pattern — URL identifies resource (groups) and the HTTP method determines the action. No URLs like `/api/createGroup` or `/api/deleteGroup` are needed since the method tell you what's happening.

#### URL Parameters
URL Parameters allows you to add variable parameters to the URL. For example `@Get(':id')` means `:id` is the **variable** part of the URL. A request to `GET /api/groups/f47ac10...`
would automatically know the last thing is the id and extract it. The ParseUUIDPipe in 
`@Param('id', ParseUUIDPipe)` automatically rejects requests where `:id` isn't a valid UUID — returning 400 Bad Request.


#### Nested Resources
Nested resources is how REST handles relationships. In this app, messages belong to a group, so the **messages controller** is at: `/api/groups/:groupdId/messages`. This URL reads like the sentence: "the messages of group X." The point is that resources are nested to show their relationships, similar to how database tables have foreign keys.


#### Frontend
Here's how the React application itself makes these requests:
```
const response = await fetch('api/groups', {
	headers: {
		Authorization: `Bearer ${accessToekn}`,
		'Content-Type': "applicaiton/json',
	},
});
```

Let's break this down:
- `await fetch(...)` -> send a and wait for response from GET request (GET is the default) to the 'groups' endpoint
- `Authorization`: ... -> attaches [[JWT]] token in the header so the server knows who you are
- `response.ok` -> true if status code is in 200s, false for 400s/500s
- `response.json()` -> parses JSON body from response

This comes full circle: React calls fetch() -> HTTP request travels to [[NestJS]] -> controller method runs -> JSON response comes back -> React renders data


### Hooks, Controllers, & Services
#### Hooks
React hooks live in the frontend, and are found in `frontend/src/hooks/...`. They are reusable functions that components call to get data. Here's how they work:
1. Call `fetch(api/...)` to make an HTTP request
2. Attach [[Authentication|auth tokens]] in the header
3. Return data (or loading/error states) to whatever component called it

#### Controllers
Controllers live in the backend and function as the entry point for HTTP requests. Here's how they work:
1. Define which URL + method combinations exist (e.g. is there `GET api/groups`? Is there `POST /api/groups` ?)
2. Extracts request data: URL params, body, auth token.
3. Delegates real work to a service
4. Returns the response

#### Services
Services also like in the backend and contain the business logic. Here's how they work:
1. Queries the database
2. Validates permissions
3. Transform data into the right shape
4. Returns results to controller



Related notes:
- [[NestJS]]
- [[Authentication]]
- [[SQL]]
- [[Relational Databases]]
- [[React Query]]





Code example:

```
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { User } from '@supabase/supabase-js';
import {
  CreateGroupDto,
  GroupDto,
  GroupDetailDto,
  GroupListDto,
} from '@app/shared';
import { GroupsService } from './groups.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import {
  CurrentUser,
  AccessToken,
} from '../auth/decorators/current-user.decorator';
import { generateId } from '@app/shared';

// Response DTO for queued operations
class JobAcceptedDto {
  jobId!: string;
  status!: string;
}

@ApiTags('Groups')
@Controller('api/groups')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class GroupsController {
  constructor(
    private groupsService: GroupsService,
    @InjectQueue('broseph-jobs') private jobQueue: Queue,
  ) {}

  @Post()                                                     // LINE 52
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({
    status: 202,
    description: 'Group creation queued',
    type: JobAcceptedDto,
  })
  @ApiResponse({ status: 400, description: 'User has reached group limit' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createGroup(
    @CurrentUser() user: User,
    @Body() dto: CreateGroupDto,
  ): Promise<JobAcceptedDto> {
    // Validate user can create a group
    await this.groupsService.validateCanCreateGroup(user.id);

    // Queue the job
    const jobId = generateId();
    await this.jobQueue.add(
      'create-group',
      {
        ownerId: user.id,
        name: dto.name,
      },
      { jobId },
    );

    return { jobId, status: 'queued' };
  }

  @Get()                                                         // LINE 83
  @ApiOperation({ summary: "List user's groups" })
  @ApiResponse({
    status: 200,
    description: 'List of groups',
    type: GroupListDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listGroups(
    @CurrentUser() user: User,
    @AccessToken() token: string,
  ): Promise<GroupListDto> {
    return this.groupsService.listGroups(user.id, token);
  }

  @Get(':id')                                                   // LINE 98
  @ApiOperation({ summary: 'Get group details with members' })
  @ApiResponse({
    status: 200,
    description: 'Group details',
    type: GroupDetailDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of this group' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @AccessToken() token: string,
  ): Promise<GroupDetailDto> {
    return this.groupsService.getGroup(id, user.id, token);
  }

  @Delete(':id')                                             // LINE 116
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Delete a group (owner only, must be empty)' })
  @ApiResponse({
    status: 202,
    description: 'Group deletion queued',
    type: JobAcceptedDto,
  })
  @ApiResponse({ status: 400, description: 'Group has other members' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the group owner' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async deleteGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<JobAcceptedDto> {
    // Validate user can delete the group
    await this.groupsService.validateCanDeleteGroup(id, user.id);

    // Queue the job
    const jobId = generateId();
    await this.jobQueue.add(
      'delete-group',
      {
        groupId: id,
        userId: user.id,
      },
      { jobId },
    );

    return { jobId, status: 'queued' };
  }
}
```
