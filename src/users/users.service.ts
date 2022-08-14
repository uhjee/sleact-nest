import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from '../entities/Users';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  getUser() {}

  async postUsers(email: string, nickname: string, password: string) {
    const user = await this.usersRepository.findOneBy({ email });
    if (user) {
      // 이미 존재하는 유저라고 에러 발생
      throw new UnauthorizedException(
        `[${email}]은 이미 존재하는 사용자 입니다.`,
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await this.usersRepository.save({
      email,
      nickname,
      password: hashedPassword,
    });
  }
}
