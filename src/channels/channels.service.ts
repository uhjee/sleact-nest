import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Channels } from '../entities/Channels';
import { Repository, MoreThan } from 'typeorm';
import { ChannelMembers } from '../entities/ChannelMembers';
import { Workspaces } from '../entities/Workspaces';
import { ChannelChats } from '../entities/ChannelChats';
import { Users } from '../entities/Users';
import { EventsGateway } from '../events/events.gateway';

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
    private readonly eventGateway: EventsGateway,
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
      throw new NotFoundException('????????? ???????????? ????????????.');
    }

    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .innerJoin('user.Workspaces', 'workspace', 'workspace.url = :url', {
        url,
      })
      .getOne();
    if (!user) {
      throw new NotFoundException('???????????? ???????????? ????????????.');
    }
    const channelMember = new ChannelMembers();
    channelMember.ChannelId = channel.id;
    channelMember.UserId = user.id;
    await this.channelMembersRespository.save(channelMember);
  }

  /**
   * TODO:: ?????? ?????? ????????? ????????????. (paging ??????)
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
        // take: ????????? ?????? - ???????????? ?????? ?????? (mysql-limit)
        .take(perPage)
        // skip: ????????? ???????????? index (mysql-start) : skip??? ????????? ?????? ????????? ???????????? ???????????? ?????? ????????? ???????????? ??????????????? ??????
        .skip(perPage * (page - 1))
        .getMany()
    );
  }

  async createWorkspaceChannelChats({
    url,
    name,
    content,
    myId,
  }: {
    url: string;
    name: string;
    content: string;
    myId: number;
  }) {
    const channel = await this.channelRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.Workspace', 'workspace', 'workspace.url = :url', {
        url,
      })
      .where('channel.name = :name', { name })
      .getOne();

    const chats = new ChannelChats();
    chats.content = content;
    chats.UserId = myId;
    chats.ChannelId = channel.id;
    const savedChat = await this.channelChatsRepository.save(chats);
    const chatWithUser = await this.channelChatsRepository.findOne({
      where: { id: savedChat.id },
      relations: ['User', 'Channel'],
    });

    // Todo:: socket.io??? '?????????????????? - ??????' ?????? ??????????????? ????????? ??????
    this.eventGateway.server
      .to(`/ws-${url}-${channel.id}`)
      .emit('message', chatWithUser);
  }

  async createWorkspaceChannelImages(
    url: string,
    name: string,
    files: Express.Multer.File[],
    myId: number,
  ) {
    console.log(files);
    const channel = await this.channelRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.Workspace', 'workspace', 'workspace.url = :url', {
        url,
      })
      .where('channel.name = :name', { name })
      .getOne();

    if (!channel) {
      throw new NotFoundException(`${name} ????????? ???????????? ????????????.`);
    }

    for (let i = 0; i < files.length; i++) {
      const chats = new ChannelChats();
      chats.content = files[i].path; // browser?????? ??? ????????? asset ??????
      chats.UserId = myId;
      chats.ChannelId = channel.id;

      const savedChat = await this.channelChatsRepository.save(chats);
      const chatWithUser = await this.channelChatsRepository.findOne({
        where: { id: savedChat.id },
        relations: ['User', 'Channel'],
      });

      // Todo:: socket.io??? '?????????????????? - ??????' ?????? ??????????????? ????????? ??????
      this.eventGateway.server
        .to(`/ws-${url}-${chatWithUser.ChannelId}`)
        .emit('message', chatWithUser);
    }
  }

  /**
   * TODO:: ?????? ?????? ?????? ??????
   * @param url
   * @param name
   * @param after
   */
  async getChannelUnreadsCount(
    url: string,
    name: string,
    after: ConstructorParameters<typeof Date>[0],
  ) {
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
        createdAt: MoreThan(new Date(after)), // ?????? ?????? ??????
      },
    });
  }
}
