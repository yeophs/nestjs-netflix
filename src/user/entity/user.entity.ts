import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../common/entity/base.entity';
import { Exclude } from 'class-transformer';
import { Movie } from '../../movie/entity/movie.entity';
import { MovieUserLike } from '../../movie/entity/movie-user-like.entity';

export enum Role {
  admin,
  paidUser,
  user,
}

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  @Exclude({
    // toClassOnly: , // 요청을 받을때
    toPlainOnly: true, // 응답을 할때
  })
  password: string;

  @Column({
    enum: Role,
    default: Role.user,
  })
  role: Role;

  @OneToMany(() => Movie, (movie) => movie.creator)
  createdMovies: Movie[];

  @OneToMany(() => MovieUserLike, (mul) => mul.user)
  likedMovies: MovieUserLike[];
}
