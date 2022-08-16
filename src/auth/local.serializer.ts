import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from '../entities/Users';

@Injectable()
export class LocalSerializer extends PassportSerializer {
  constructor(
    @InjectRepository(Users) private userRepository: Repository<Users>,
  ) {
    super();
  }

  /**
   * userId를 직렬화해 session에 저장해둔다.
   * @param user
   * @param done
   */
  serializeUser(user: Users, done: CallableFunction) {
    console.log('-> serialized user', user);
    done(null, user.id); // session에 저장
  }

  /**
   * session에 있는 userId를 찾아 userdata를 조회해온다.
   * @param userId
   * @param done
   */
  async deserializeUser(userId: string, done: CallableFunction) {
    return await this.userRepository
      .findOneOrFail({
        // + :: 단항 연산자 string to number(Nan -> 0)
        where: { id: +userId },
        select: ['id', 'email', 'nickname'],
        relations: ['Workspaces'], // 속해있는 workspaces 도 같이 가져오도록
      })
      .then((user) => {
        console.log('-> desirialized user', user);
        done(null, user); // request.user로 등록
      })
      .catch((error) => done(error));
  }
}
