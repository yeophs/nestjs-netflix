import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  detail: string;

  @IsNotEmpty()
  @IsNumber()
  directorId: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  genreIds: number[];

  @IsString()
  movieFileName: string;
}
