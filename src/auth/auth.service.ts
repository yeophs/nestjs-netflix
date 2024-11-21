import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User } from '../user/entity/user.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { envVariableKeys } from '../common/const/env.const';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async blockToken(token: string) {
    const payload = await this.jwtService.decode(token);

    const expiryDate = Number(new Date(payload['exp'] * 1000));
    const now = Number(Date.now());

    const differenceInSeconds = (expiryDate - now) / 1000;

    await this.cacheManager.set(
      `BLOCK_TOKEN_${token}`,
      payload,
      Math.max(differenceInSeconds * 1000, 1),
    );

    return true;
  }

  private parseBasicToken(rawToken: string) {
    // 1) 토큰을 ' ' 기준으로 스플릿 한 후 토큰 값만 추출하기
    // ['Basic', $token]
    const basicSplit = rawToken.split(' ');
    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    const [basic, token] = basicSplit;
    if (basic.toLowerCase() !== 'basic') {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }
    // 2) 추출한 토큰을 base64 디코딩해서 이메일과 비밀번호로 나눈다.
    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    // "email:password" -> [email, password]
    const tokenSplit = decoded.split(':');
    if (tokenSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    const [email, password] = tokenSplit;

    return {
      email,
      password,
    };
  }

  /**
   * ACCESS_TOKEN_SECRET과 REFRESH_TOKEN_SECRET이 다르다고 가정.
   *
   * if isRefreshToken == true,
   * secret = REFRESH_TOKEN_SECRET 이 된다.
   * 만약 ACCESS TOKEN이 전달될 경우 해당 ACCESS TOKEN을 만들 때 ACCESS_TOKEN_SECRET을 사용했으므로
   * signature가 맞지 않아 verifyAsync를 통과하지 못함.
   *
   * if isRefreshToken == false,
   * secret = ACCESS_TOKEN_SECRET 이 된다.
   * 만약 REFRESH TOKEN이 전달될 경우 해당 REFRESH TOKEN을 만들 때 REFRESH_TOKEN_SECRET을 사용했으므로
   * signature가 맞지 않아 verifyAsync를 통과하지 못함.
   */

  async parseBearerToken(rawToken: string, isRefreshToken: boolean) {
    const bearerSplit = rawToken.split(' ');
    if (bearerSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    const [bearer, token] = bearerSplit;
    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    const secret = this.configService.get<string>(
      isRefreshToken
        ? envVariableKeys.REFRESH_TOKEN_SECRET
        : envVariableKeys.ACCESS_TOKEN_SECRET,
    );

    let payload;

    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret,
      });
    } catch (err) {
      throw new BadRequestException('유효하지 않은 토큰입니다!');
    }

    if (isRefreshToken) {
      if (payload.type !== 'refresh') {
        throw new BadRequestException('RefreshToken을 입력해주세요!');
      }
    } else {
      if (payload.type !== 'access') {
        throw new BadRequestException('AccessToken을 입력해주세요!');
      }
    }

    return payload;
  }

  // rawToken -> "Basic $token"
  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (user) {
      throw new BadRequestException('이미 가입한 이메일입니다!');
    }

    // 비밀번호 해쉬
    const hash = await bcrypt.hash(
      password,
      this.configService.get<number>(envVariableKeys.HASH_ROUNDS),
    );

    await this.userRepository.save({
      email,
      password: hash,
    });

    return await this.userRepository.findOne({ where: { email } });
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) throw new BadRequestException('잘못된 로그인 정보입니다!');

    const passOk = await bcrypt.compare(password, user.password);
    if (!passOk) throw new BadRequestException('잘못된 로그인 정보입니다!');

    return user;
  }

  async issueToken(user: { id: number; role: Role }, isRefreshToken: boolean) {
    const refreshTokenSecret = this.configService.get<string>(
      envVariableKeys.REFRESH_TOKEN_SECRET,
    );
    const accessTokenSecret = this.configService.get<string>(
      envVariableKeys.ACCESS_TOKEN_SECRET,
    );

    return await this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        type: isRefreshToken ? 'refresh' : 'access',
      },
      {
        secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
        expiresIn: isRefreshToken ? '24h' : 300,
      },
    );
  }

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.authenticate(email, password);

    return {
      refreshToken: await this.issueToken(user, true),
      accessToken: await this.issueToken(user, false),
    };
  }
}
