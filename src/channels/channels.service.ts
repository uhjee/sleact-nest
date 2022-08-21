import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Channels } from '../entities/Channels';
import { Repository, MoreThan } from 'typeorm';
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
        { myId },
      )
      .innerJoinAndSelect(
        'channels.Workspace',
        'workspace',
        'workspace.url = :url',
        { url },
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

  async createWorkspaceChannels(url: string, name: string, myId: number) {
    const workspace = await this.workspacesRepository.findOne({
      where: {
        url,
      },
    });

    const channel = new Channels();
    channel.name = name;
    channel.WorkspaceId = workspace.id;
    const channelReturned = await this.channelRepository.save(channel);

    const channelMember = new ChannelMembers();
    channelMember.UserId = myId;
    channelMember.ChannelId = channelReturned.id;
    await this.channelMembersRespository.save(channelMember);
  }

  async getWorkspaceChannelMembers(url: string, name: string) {
    return this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.Channels', 'channels', 'channels.name = :name', {
        name,
      })
      .innerJoin('channels.Workspace', 'workspace', 'workspace.url = :url', {
        url,
      })
      .getMany();
  }

  async createWorkspaceChannelMembers(
    url: string,
    name: string,
    email: string,
  ) {
    const channel = await this.channelRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.Workspace', 'workspace', 'workspace.url = :url', {
        url,
      })
      .where('channel.name = :name', { name })
      .getOne();
    if (!channel) {
      throw new NotFoundException('채널이 존재하지 않습니다.');
    }

    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .innerJoin('user.Workspaces', 'workspace', 'workspace.url = :url', {
        url,
      })
      .getOne();
    if (!user) {
      throw new NotFoundException('사용자가 존재하지 않습니다.');
    }
    const channelMember = new ChannelMembers();
    channelMember.ChannelId = channel.id;
    channelMember.UserId = user.id;
    await this.channelMembersRespository.save(channelMember);
  }

  /**
   * TODO:: 채널 대화 목록을 조회한다. (paging 처리)
   * @param url
   * @param name
   * @param perPage
   * @param page
   */
  async getWorkspaceChannelChats(
    url: string,
    name: string,
    perPage: number,
    page: number,
  ) {
    return (
      this.channelChatsRepository
        .createQueryBuilder('channelChats')
        .innerJoin('channelChats.Channel', 'channel', 'channel.name = :name', {
          name,
        })
        .innerJoin('channel.Workspace', 'workspace', 'workspace.url = :url', {
          url,
        })
        .innerJoinAndSelect('channelChats.User', 'user')
        .orderBy('channelChats.createdAt', 'DESC')
        // take: 가져올 개수 - 페이지당 표현 개수 (mysql-limit)
        .take(perPage)
        // skip: 가져올 데이터의 index (mysql-start) : skip에 인자로 받는 개수의 데이터를 생략하고 다음 순서의 데이터를 가져온다고 생각
        .skip(perPage * (page - 1))
        .getMany()
    );
  }

  /**
   * TODO:: 날짜 기간 조건 조회
   * @param url
   * @param name
   * @param after
   */
  async getChannelUnreadsCount(url: string, name: string, after: ConstructorParameters<typeof Date>[0]) {
    const channel = await this.channelRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.Workspace', 'workspace', 'workspace.url = :url', {
        url,
      })
      .where('channel.name =:name', { name })
      .getOne();
    return this.channelChatsRepository.count({
      where: {
        ChannelId: channel.id,
        createdAt: MoreThan(new Date(after)), // 기간 조건 조회
      },
    });
  }
}
