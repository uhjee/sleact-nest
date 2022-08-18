import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Channels } from '../entities/Channels';
import { Repository } from 'typeorm';
import { ChannelMembers } from '../entities/ChannelMembers';
import { Workspaces } from '../entities/Workspaces';
import { ChannelChats } from '../entities/ChannelChats';
import { Users } from '../entities/Users';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channels)
    private channelRepository: Repository<Channels>,
    @InjectRepository(ChannelMembers)
    private channelMembersRespository: Repository<ChannelMembers>,
    @InjectRepository(Workspaces)
    private workspacesRepository: Repository<Workspaces>,
    @InjectRepository(ChannelChats)
    private channelChatsRepository: Repository<ChannelChats>,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async findById(id: number) {
    return this.channelRepository.findOne({ where: { id } });
  }

  async getWorkspaceChannels(url: string, myId: number) {
    return this.channelRepository
      .createQueryBuilder('channels')
      .innerJoinAndSelect(
        'channels.ChannelMembers',
        'channelMembers',
        'channelMembers.userId = :myId',
        {
          myId,
        },
      )
      .innerJoinAndSelect(
        'channels.Workspace',
        'workspace',
        'workspace.url = :url',
        {
          url,
        },
      )
      .getMany();
  }

  async getWorkspaceChannel(url: string, name: string) {
    return this.channelRepository.findOne({
      where: {
        name,
      },
      relations: ['Workspace'],
    });
  }
}
