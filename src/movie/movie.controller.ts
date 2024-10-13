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
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';
import { RBAC } from '../auth/decorator/rbac.decorator';
import { Role } from '../user/entity/user.entity';
import { Public } from '../auth/decorator/public.decorator';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly moviesService: MovieService) {}

  @Public()
  @Get()
  getMovies(@Query('title', MovieTitleValidationPipe) title?: string) {
    // title 쿼리의 타입이 string 타입인지? 검증은 컨트롤러에서 함
    return this.moviesService.findAll(title);
  }

  @RBAC(Role.admin)
  @Public()
  @Get(':id')
  getMovie(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.findOne(id);
  }

  @RBAC(Role.admin)
  @Post()
  postMovie(@Body() body: CreateMovieDto) {
    return this.moviesService.create(body);
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
