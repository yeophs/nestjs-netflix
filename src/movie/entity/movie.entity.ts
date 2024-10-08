import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { MovieDetail } from './movie-detail.entity';

// ManyToOne Director -> 감독은 여러 개의 영화를 만들 수 있음
// OneToOne MovieDetail -> 영화는 하나의 상세 내용을 가질 수 있음
// ManyToMany Genre -> 영화는 여러 개의 장르를 가질 수 있고, 장르는 여러 개의 영화에 속할 수 있음

@Entity()
export class Movie extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;

  @OneToOne(() => MovieDetail, (movieDetail) => movieDetail.id, {
    cascade: true,
  })
  @JoinColumn()
  detail: MovieDetail;
}

/*
import { Exclude, Expose, Transform } from 'class-transformer';

// @Exclude() // 보안에 민감한 데이터일 때, 내부들을 모두 감추고 각각 Expose로 노출 시킬 수 있음.
export class Movie {
  // @Expose()
  id: number;
  // @Expose()
  title: string;

  // @Expose()
  // @Exclude() // 직렬화 과정에서 해당 값을 노출시키지 않음.
  @Transform(({ value }) => value.toString().toUpperCase())
  genre: string;

  // @Expose() // getter 노출할 때도 유용함.
  // get description() {
  //   return `id: ${this.id} title: ${this.title}`;
  // }
}
*/
