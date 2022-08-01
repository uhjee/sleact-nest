import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DmsService } from './dms.service';

@ApiTags('DM')
@Controller('api/workspaces/:url/dms')
export class DmsController {
  constructor(private dmsService: DmsService) {}

  @ApiParam({
    name: 'url',
    required: true,
    description: '워크스페이스 URL',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: '사용자 아이디',
  })
  @ApiQuery({
    name: 'perPage',
    required: true,
    description: '하나의 페이지에 가져오는 개수',
  })
  @ApiQuery({
    name: 'page',
    required: true,
    description: '불러올 페이지',
  })
  @Get('/:id/chats')
  getChat(@Query() query, @Param() param) {
    console.log(query.perPage, query.page);
    console.log(param.id, param.url);
  }

  @Post('/:id/chats')
  postChat(@Body() data) {}
}
