import { Module } from '@nestjs/common';
import { MovieModule } from './movie/movie.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { Movie } from './movie/entity/movie.entity';
import { MovieDetail } from './movie/entity/movie-detail.entity';
import { DirectorModule } from './director/director.module';
import { Director } from './director/entity/director.entity';
import { GenreModule } from './genre/genre.module';
import { Genre } from './genre/entity/genre.entity';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { User } from './user/entity/user.entity';
import { envVariableKeys } from './common/const/env.const';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 어떤 모듈에서든 ConfigModule에 등록된 환경변수들을 사용할 수 있도록 해줌
      validationSchema: Joi.object({
        ENV: Joi.string().valid('dev', 'prod').required(),
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        HASH_ROUNDS: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
      }),
    }),
    // 비동기여야 되는 이유? ConfigModule이 IoC에 모두 등록된 이후 받으려고!
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>(envVariableKeys.DB_TYPE) as 'postgres',
        host: configService.get<string>(envVariableKeys.DB_HOST),
        port: configService.get<number>(envVariableKeys.DB_PORT),
        username: configService.get<string>(envVariableKeys.DB_USERNAME),
        password: configService.get<string>(envVariableKeys.DB_PASSWORD),
        database: configService.get<string>(envVariableKeys.DB_DATABASE),
        entities: [Movie, MovieDetail, Director, Genre, User],
        synchronize: true, // 개발할 때만 true, prod에선 false
      }),
      inject: [ConfigService],
    }),
    // TypeOrmModule.forRoot({
    //   type: process.env.DB_TYPE as 'postgres',
    //   host: process.env.DB_HOST,
    //   port: parseInt(process.env.DB_PORT),
    //   username: process.env.DB_USERNAME,
    //   password: process.env.DB_PASSWORD,
    //   database: process.env.DB_DATABASE,
    //   entity: [],
    //   synchronize: true, // 개발할 때만 true, prod에선 false
    // }),
    MovieModule,
    DirectorModule,
    GenreModule,
    AuthModule,
    UserModule,
  ], // 또 다른 모듈을 이 모듈로 불러들일 때 사용
})
export class AppModule {}
