import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { RBAC } from '../auth/decorator/rbac.decorator';
import { Role } from '../user/entity/user.entity';
import { Public } from '../auth/decorator/public.decorator';
import { GetMoviesDto } from './dto/get-movies.dto';
import { TransactionInterceptor } from '../common/interceptor/transaction.interceptor';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserId } from '../user/decorator/user-id.decorator';
import { QueryRunner } from '../common/decorator/query-runner.decorator';
import { QueryRunner as QR } from 'typeorm';
import {
  CacheKey,
  CacheTTL,
  CacheInterceptor as CI,
} from '@nestjs/cache-manager';
import { Throttle } from 'src/common/decorator/throttle.decorator';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Public()
  @Get()
  @Throttle({ count: 5, unit: 'minute' })
  getMovies(@Query() dto: GetMoviesDto, @UserId() userId?: number) {
    return this.movieService.findAll(dto, userId);
  }

  // /movie/recent -> 아래 :id에 걸리지 않게 위에 선언.
  @Get('recent')
  @UseInterceptors(CI)
  @CacheKey('getMoviesRecent') // 키를 직접 설정해주므로 쿼리 파라미터가 변경되어도 같은 키를 가진다.
  @CacheTTL(1000)
  getMoviesRecent() {
    return this.movieService.findRecent();
  }

  @Public()
  @Get(':id')
  getMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.findOne(id);
  }

  @RBAC(Role.admin)
  @Post()
  @UseInterceptors(TransactionInterceptor)
  @UseInterceptors(
    FileInterceptor('movie', {
      limits: {
        fileSize: 10_000_000,
      },
      fileFilter(req, file, callback) {
        if (file.mimetype !== 'video/quicktime') {
          return callback(
            new BadRequestException('quicktime 타입만 업로드 가능합니다.'),
            false,
          );
        }

        return callback(null, true);
      },
    }),
  )
  postMovie(
    @Body() body: CreateMovieDto,
    @QueryRunner() queryRunner: QR,
    @UserId() userId: number,
  ) {
    return this.movieService.create(body, userId, queryRunner);
  }

  @RBAC(Role.admin)
  @Patch(':id')
  patchMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMovieDto,
  ) {
    return this.movieService.update(id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.remove(id);
  }

  @Post(':id/like')
  createMovieLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  createMovieDislike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, false);
  }
}
