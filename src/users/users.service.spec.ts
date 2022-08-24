import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Users } from '../entities/Users';
import { WorkspaceMembers } from '../entities/WorkspaceMembers';
import { ChannelMembers } from '../entities/ChannelMembers';
import { DataSource } from 'typeorm';

class MockUserRepository {
  #data = [{ id: 1, email: '123@naver.com', password: 'cnp' }];

  findOneBy({ email }) {
    const data = this.#data.find((v) => v.email === email);
    if (data) return data;
    return null;
  }
}

class MockChannelMembersRepository {}

class MockWorkspaceMembersRepository {}

describe('UsersService', () => {
  let service: UsersService;
  let dataSource: DataSource;

  beforeEach(async () => {
    // service mocking
    const module: TestingModule = await Test.createTestingModule({
      // service에서 의존성을 주입받는 생성자 매개변수들 모킹
      providers: [
        UsersService,
        // repository mocking
        {
          provide: getRepositoryToken(Users),
          useClass: MockUserRepository,
        },
        {
          provide: getRepositoryToken(ChannelMembers),
          useClass: MockChannelMembersRepository,
        },
        {
          provide: getRepositoryToken(WorkspaceMembers),
          useClass: MockWorkspaceMembersRepository,
        },
        {
          provide: getDataSourceToken(),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findByEmail은 이메일을 통해 유저를 조회함', () => {
    const user = {
      email: '123@naver.com',
      id: 1,
      password: 'cnp',
    };
    expect(service.getUserByEmail('123@naver.com')).resolves.toStrictEqual(user);
  });

  // TOdO 의 경우
  // it.todo('findByEmail은 유저를 못찾으면 null을 반환해야 함', () => {});
  it('findByEmail은 유저를 못찾으면 null을 반환해야 함', () => {
    expect(service.getUserByEmail('123@nav.com')).resolves.toBeNull();
  });
});
