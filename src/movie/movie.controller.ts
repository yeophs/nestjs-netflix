import {
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
  Request,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { RBAC } from '../auth/decorator/rbac.decorator';
import { Role } from '../user/entity/user.entity';
import { Public } from '../auth/decorator/public.decorator';
import { GetMoviesDto } from './dto/get-movies.dto';
import { TransactionInterceptor } from '../common/interceptor/transaction.interceptor';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { MovieFilePipe } from './pipe/movie-file.pipe';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly moviesService: MovieService) {}

  @Public()
  @Get()
  getMovies(@Query() dto: GetMoviesDto) {
    return this.moviesService.findAll(dto);
  }

  @Public()
  @Get(':id')
  getMovie(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.findOne(id);
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
    @Request() req,
    @UploadedFile()
    movie: Express.Multer.File,
  ) {
    return this.moviesService.create(body, movie.filename, req.queryRunner);
  }

  @RBAC(Role.admin)
  @Patch(':id')
  patchMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMovieDto,
  ) {
    return this.moviesService.update(id, body);
  }

  @Delete(':id')
  deleteMovie(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.remove(id);
  }
}
