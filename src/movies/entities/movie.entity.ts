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
