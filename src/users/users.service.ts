import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from '../entities/Users';
import { DataSource, Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { ChannelMembers } from '../entities/ChannelMembers';
import { WorkspaceMembers } from '../entities/WorkspaceMembers';
import { query } from 'express';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(WorkspaceMembers)
    private workspacesMembersRepository: Repository<WorkspaceMembers>,
    @InjectRepository(ChannelMembers)
    private channelMembersRepository: Repository<ChannelMembers>,
    private dataSource: DataSource,
  ) {}

  getUser() {}

  async getUserByEmail(email: string): Promise<Users> {
    return this.usersRepository.findOneBy({ email });
  }

  async signUp(email: string, nickname: string, password: string) {
    // transaction 처리
    const queryRunner = this.dataSource.createQueryRunner();

    // queryRunner 를 통한 repository 생성
    const userRepository = queryRunner.manager.getRepository(Users);
    const workspaceMembersRepository =
      queryRunner.manager.getRepository(WorkspaceMembers);
    const channelMembersRepository =
      queryRunner.manager.getRepository(ChannelMembers);
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const user = await userRepository.findOneBy({ email });
    if (user) {
      throw new UnauthorizedException(
        `[${email}]은 이미 존재하는 사용자 입니다.`,
      );
    }

    try {
      // 1. salt 생성
      const salt = await bcrypt.genSalt();

      // salt + password hash 처리
      const hashedPassword = await bcrypt.hash(password, salt);
      const returned = await this.usersRepository.save({
        email,
        nickname,
        password: hashedPassword,
      });

      // 워크스페이스-사용자 기본 생성
      await workspaceMembersRepository.save({
        UserId: returned.id,
        WorkspaceId: 1,
      });
      // 채널-사용자 기본 생성
      await channelMembersRepository.save({
        UserId: returned.id,
        ChannelId: 1,
      });
      return true;
    } catch (error) {
      console.log(error);
      await queryRunner.rollbackTransaction();
      throw new UnauthorizedException('유저 생성에 실패했습니다.');
    } finally {
      await queryRunner.release();
    }
  }
}
