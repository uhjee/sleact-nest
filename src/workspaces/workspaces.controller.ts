import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { User } from '../common/decorator/user.decorator';

@ApiTags('WORKSPACE')
@Controller('api/workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  getMyWorkspaces(@User() user) {
    return this.workspacesService.findMyWorkspaces(user.id);
  }

  @Post()
  createWorkspac() {}

  @Get(':url/members')
  getAllMembersFromWorkspace(@Param('url') url: string) {
    return this.workspacesService.getWorkspaceMembers(url);
  }

  @Post(':url/members')
  inviteMembersToWorkspace() {}

  @Delete(':url/members/:id')
  kickMemberFromWorkspace() {}

  @Get(':url/members/:id')
  getMemberInfoInWorkspace() {}

  @Get(':url/users/:id')
  DEPRECATED_getMemberInfoInWorkspace() {
    this.getMemberInfoInWorkspace();
  }
}
