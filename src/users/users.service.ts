import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from '../entities/Users';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  getUser() {}

  async getUserByEmail(email: string): Promise<Users> {
    return this.usersRepository.findOneBy({ email });
  }

  async signUp(email: string, nickname: string, password: string) {
    const user = await this.usersRepository.findOneBy({ email });
    if (user) {
      throw new UnauthorizedException(
        `[${email}]은 이미 존재하는 사용자 입니다.`,
      );
    }

    // 1. salt 생성
    const salt = await bcrypt.genSalt();

    // salt + password hash 처리
    const hashedPassword = await bcrypt.hash(password, salt);
    await this.usersRepository.save({
      email,
      nickname,
      password: hashedPassword,
    });
  }
}
