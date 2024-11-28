import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';

@Injectable()
export class TasksService {
  constructor() {}

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
}
