import { Injectable } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';
import { DefaultLogger } from './logger/default.logger';

@Injectable()
export class TasksService {
  // private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly logger: DefaultLogger,
  ) {}

  @Cron('*/5 * * * * *')
  logEverySecond() {
    // fatal, error, warn, log, debug, verbose
    // 필요 <------------------> 별로 필요 없음 (기준은 프로젝트마다 다름, 아래는 일반적인 기준)
    this.logger.fatal('FATAL 레벨 로그'); // 지금 당장 해결해야 하는 문제
    this.logger.error('ERROR 레벨 로그'); // 중요한 문제가 생김
    this.logger.warn('WARN 레벨 로그'); // 일어나면 안좋지만, 프로그램 실행에 문제가 되진 않음.
    this.logger.log('LOG 레벨 로그'); // 정보성 로그(== info)
    this.logger.debug('DEBUG 레벨 로그'); // dev 환경에서 확인하기 위해 사용하는 로그
    this.logger.verbose('VERBOSE 레벨 로그'); // 진짜 중요하지 않은 내용. 궁금해서 찍어본 로그
  }

  // @Cron('* * * * * *')
  async eraseOrphanedFiles() {
    const files = await readdir(join(process.cwd(), 'public', 'temp'));

    const deleteFilesTargets = files.filter((file) => {
      const filename = parse(file).name; // 확장자를 제외한 이름이 나옴.

      const split = filename.split('_');

      // 확장자를 제외한 파일명은 무조건 length가 2다. UUID_epoch.ext
      if (split.length !== 2) {
        return true;
      }

      try {
        const date = Number(new Date(parseInt(split[split.length - 1])));
        const aDayInMilSec = 24 * 60 * 60 * 1000;
        const now = Number(new Date());

        return now - date > aDayInMilSec;
      } catch (err) {
        return true;
      }
    });

    await Promise.all(
      deleteFilesTargets.map((file) => {
        unlink(join(process.cwd(), 'public', 'temp', file));
      }),
    );
  }

  // @Cron('0 * * * * *')
  async calculateMovieLikeCounts() {
    await this.updateLikeCounts();
    await this.updateDislikeCounts();
  }

  private async updateDislikeCounts() {
    await this.movieRepository.query(
      `
UPDATE movie m
SET "dislikeCount" = (
    SELECT count(*) FROM movie_user_like mul
    WHERE m.id = mul."movieId" AND mul."isLike" = false
);
`,
    );
  }

  private async updateLikeCounts() {
    await this.movieRepository.query(
      `
UPDATE movie m
SET "likeCount" = (
    SELECT count(*) FROM movie_user_like mul
    WHERE m.id = mul."movieId" AND mul."isLike" = true
);
`,
    );
  }

  // @Cron('* * * * * *', {
  //   name: 'printer',
  // })
  printer() {
    console.log('print every seconds');
  }

  // @Cron('*/5 * * * * *')
  stopper() {
    console.log('---stopper run---');

    const job = this.schedulerRegistry.getCronJob('printer');

    console.log('# Last Date');
    console.log(job.lastDate());
    console.log('# Next Date');
    console.log(job.nextDate());
    console.log('# Next Dates');
    console.log(job.nextDates(5));
    if (job.running) {
      job.stop();
    } else {
      job.start();
    }
  }
}
