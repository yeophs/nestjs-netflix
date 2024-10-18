import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from '../director/entity/director.entity';
import { Genre } from '../genre/entity/genre.entity';
import { CommonModule } from '../common/common.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import * as uuid from 'uuid';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movie, MovieDetail, Director, Genre]),
    CommonModule,
    MulterModule.register({
      storage: diskStorage({
        /**
         * path: ....../netflix/public/movie
         * process.cwd() + '/public' + '/movie' 이렇게 해도 되는데,
         * 운영체제 마다 파일시스템이 달라 안전하게 join 함수를 사용한다.(윈도우에서는 \로 구분함)
         */
        destination: join(process.cwd(), 'public', 'movie'),
        filename: (req, file, cb) => {
          const split = file.originalname.split('.');

          let extension = 'mp4';

          if (split.length > 1) {
            extension = split[split.length - 1];
          }

          cb(null, `${uuid.v4()}_${Date.now()}.${extension}`);
        },
      }),
    }),
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
