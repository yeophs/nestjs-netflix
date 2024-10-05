import { Module } from '@nestjs/common';
import { MoviesModule } from './movies/movies.module';

@Module({
  imports: [MoviesModule], // 또 다른 모듈을 이 모듈로 불러들일 때 사용
})
export class AppModule {}
