import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspaces } from '../entities/Workspaces';
import { Repository } from 'typeorm';
import { Channels } from '../entities/Channels';
import { WorkspaceMembers } from '../entities/WorkspaceMembers';
import { ChannelMembers } from '../entities/ChannelMembers';
import { Users } from '../entities/Users';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspaces)
    private workspacesRepository: Repository<Workspaces>,
    @InjectRepository(Channels)
    private channelsRepository: Repository<Channels>,
    @InjectRepository(WorkspaceMembers)
    private workspaceMembersRepository: Repository<WorkspaceMembers>,
    @InjectRepository(ChannelMembers)
    private channelMembersRepository: Repository<ChannelMembers>,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async findById(id: number) {
    return this.workspacesRepository.findOneBy({ id });
  }

  async findMyWorkspaces(myId: number) {
    return this.workspacesRepository.find({
      where: {
        WorkspaceMembers: [{ UserId: myId }],
      },
    });
  }

  async createWorkspace(name: string, url: string, myId: number) {
    // 워크스페이스 생성
    const workspace = this.workspacesRepository.create({
      name,
      url,
      OwnerId: myId,
    });
    const returned = await this.workspacesRepository.save(workspace);

    // 워크스페이스-멤버 생성
    const workspaceMember = new WorkspaceMembers();
    workspaceMember.UserId = myId;
    workspaceMember.WorkspaceId = returned.id;

    // 채널 생성
    const channel = new Channels();
    channel.name = '일반';
    channel.WorkspaceId = returned.id;

    // Promise all()을 통해 동시에 처리가 가능한 경우에는 요청 동시에 보내기
    const [, channelReturned] = await Promise.all([
      await this.workspacesRepository.save(workspaceMember),
      await this.channelsRepository.save(channel),
    ]);

    // 채널-멤버 생성
    const channelMember = new ChannelMembers();
    channelMember.UserId = myId;
    channelMember.ChannelId = channelReturned.id;
    await this.channelMembersRepository.save(channelMember);
  }

  async getWorkspaceMembers(url: string) {
    return await this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.WorkspaceMembers', 'members')
      .innerJoin('members.Workspace', 'workspace', 'workspace.url = :url', {
        url,
      })
      .getMany();
  }

  async createWorkspaceMember(url, email) {
    // const workspace = await this.workspacesRepository.findOne({
    //   where: { url },
    //   join: {
    //     alias: 'workspace',
    //     innerJoinAndSelect: {
    //       channels: 'workspace.Channels',
    //     },
    //   },
    // });

    // 위와 query와 같음 - queryBuilder 가 좀더 세부적으로 세팅 가능
    const workspace = await this.workspacesRepository
      .createQueryBuilder('workspace')
      .where({ url })
      .innerJoinAndSelect('workspace.Channels', 'channels')
      .getOne();

    const user = await this.usersRepository.findOne({
      where: { email },
    });

    // 워크스페이스-멤버 생성
    const workspaceMember = new WorkspaceMembers();
    workspaceMember.WorkspaceId = workspace.id;
    workspaceMember.UserId = user.id;
    await this.workspaceMembersRepository.save(workspaceMember);

    // 채널-멤버 생성
    const channelMember = new ChannelMembers();
    channelMember.ChannelId = workspace.Channels.find(
      (channel) => channel.name === '일반',
    ).id;
    await this.channelMembersRepository.save(channelMember);
  }

  async getWorksapceMember(url: string, id: number) {
    return this.usersRepository
      .createQueryBuilder('user')
      .where({ id })
      .innerJoin('user.Workspaces', 'workspaces', 'workspaces.url = :url', {
        url,
      })
      .getOne();
  }
}
