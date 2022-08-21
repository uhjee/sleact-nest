import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { UsersModule } from './users/users.module';
import { ChannelsModule } from './channels/channels.module';
import { DmsModule } from './dms/dms.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelChats } from './entities/ChannelChats';
import { ChannelMembers } from './entities/ChannelMembers';
import { Channels } from './entities/Channels';
import { DMs } from './entities/DMs';
import { Mentions } from './entities/Mentions';
import { Users } from './entities/Users';
import { WorkspaceMembers } from './entities/WorkspaceMembers';
import { Workspaces } from './entities/Workspaces';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';

const getEnvData = async () => {
  // 나중에 여기서 .env 데이터 load 해오기
  return {
    DB_USERNAME: 'root',
    DB_POSSWORD: 'system',
    DB_DATABASE: 'sleact',
  };
};

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true, load: [getEnvData] }), // .env를  cloud 서비스 등, api 요청 보낸 후 가져와서 사용하기
    // ConfigModule.forRoot({ isGlobal: true }), // root의 .env 에서 가져오기
    UsersModule,
    ChannelsModule,
    DmsModule,
    WorkspacesModule,
    // TypeOrmModule.forRoot(ormconfig), // .env에서 가져오기
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          type: 'mariadb',
          host: 'localhost',
          port: 3306,
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          entities: [
            ChannelChats,
            ChannelMembers,
            Channels,
            DMs,
            Mentions,
            Users,
            WorkspaceMembers,
            Workspaces,
            // __dirname + '/**/*.entity.{js,ts}',
          ],
          migrations: [__dirname + '/src/migrations/*.ts'],
          // cli: { migrationsDir: 'src/migrations' },
          autoLoadEntities: true,
          charset: 'utf8mb4',
          synchronize: false,
          logging: true,
          keepConnectionAlive: true,
        };
      },
    }),
    EventsModule,
  ],
  controllers: [AppController],
  providers: [ConfigService, AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*'); // 모든 route에 대해 미들웨어 적용
  }
}
