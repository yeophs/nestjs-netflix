import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { CommonController } from './common.controller';
import * as uuid from 'uuid';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from 'src/movie/entity/movie.entity';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        /**
         * path: ....../netflix/public/movie
         * process.cwd() + '/public' + '/movie' 이렇게 해도 되는데,
         * 운영체제 마다 파일시스템이 달라 안전하게 join 함수를 사용한다.(윈도우에서는 \로 구분함)
         */
        destination: join(process.cwd(), 'public', 'temp'),
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
    TypeOrmModule.forFeature([Movie]),
  ],
  controllers: [CommonController],
  providers: [CommonService, TasksService],
  exports: [CommonService],
})
export class CommonModule {}
