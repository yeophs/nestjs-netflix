import { BadRequestException, Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { PagePaginationDto } from './dto/page-pagination.dto';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';

@Injectable()
export class CommonService {
  constructor() {}

  applyPagePaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    dto: PagePaginationDto,
  ) {
    const { page, take } = dto;

    const skip = (page - 1) * take;

    qb.take(take);
    qb.skip(skip);
  }

  async applyCursorPaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    dto: CursorPaginationDto,
  ) {
    let { order, cursor, take } = dto;

    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');

      /**
       * {
       *   values: {
       *     id: 27
       *   },
       *   order: ['id_DESC']
       * }
       */
      const cursorObj = JSON.parse(decodedCursor);

      order = cursorObj.order;

      const { values } = cursorObj;
      // (movie.column1, movie.column2, movie.column3) > (:value1, :value2, :value3)
      const columns = Object.keys(values);
      const comparisonOperator = order.some((o) => o.endsWith('DESC')) // 모두 DESC 혹은 ASC로 통일되어있다 가정
        ? '<'
        : '>';
      const whereConditions = columns.map((c) => `${qb.alias}.${c}`).join(',');
      const whereParams = columns.map((c) => `:${c}`).join(',');

      qb.where(
        `(${whereConditions}) ${comparisonOperator} (${whereParams})`,
        values,
      );
    }

    // ex) order: ["likeCount_DESC", "id_DESC"]
    for (let i = 0; i < order.length; i++) {
      const [column, direction] = order[i].split('_');

      // direction 검증 => 'ASC' | 'DESC'
      if (direction !== 'ASC' && direction !== 'DESC') {
        throw new BadRequestException(
          'Order는 ASC 또는 DESC으로 입력해주세요!',
        );
      }

      // QueryBuilder 에 orderBy 추가
      if (i == 0) {
        qb.orderBy(`${qb.alias}.${column}`, direction);
      } else {
        qb.addOrderBy(`${qb.alias}.${column}`, direction);
      }
    }

    qb.take(take);

    const results = await qb.getMany();
    const nextCursor = this.generateNextCursor(results, order);

    return { qb, nextCursor };
  }

  generateNextCursor<T>(results: T[], order: string[]): string | null {
    if (results.length === 0) return null;

    /**
     * {
     *   values: {
     *     id: 27
     *   },
     *   order: ['id_DESC']
     * }
     */

    const lastItem = results[results.length - 1];
    const values = {};

    order.forEach((columnOrder) => {
      const [column] = columnOrder.split('_');
      values[column] = lastItem[column];
    });

    const cursorObj = { values, order };
    const nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString(
      'base64',
    );

    return nextCursor;
  }
}
