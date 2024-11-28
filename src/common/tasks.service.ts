import { Injectable } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  logEverySecond() {
    console.log('1초마다 실행!');
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
