import {
  Contains,
  Equals,
  IsAlphanumeric,
  IsArray,
  IsBoolean,
  IsCreditCard,
  IsDate,
  IsDateString,
  IsDefined,
  IsDivisibleBy,
  IsEmpty,
  IsEnum,
  IsHexColor,
  IsIn,
  IsInt,
  IsLatLong,
  IsNegative,
  IsNotEmpty,
  IsNotIn,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  NotContains,
  NotEquals,
  registerDecorator,
  Validate,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';

enum MovieGenre {
  Fantasy = 'fantasy',
  Action = 'action',
}

@ValidatorConstraint({
  async: true,
})
class PasswordValidator implements ValidatorConstraintInterface {
  validate(
    value: any,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> | boolean {
    // 비밀번호 길이는 4-8
    return value.length > 4 && value.length < 8;
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    return '비밀번호의 길이는 4~8자 여야합니다. 입력된 비밀번호: ($value)';
  }
}

function IsPasswordValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: PasswordValidator,
    });
  };
}

export class UpdateMovieDto {
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  genre?: string;

  // -- 기본 Validator
  // @IsDefined() // null || undefined
  // @IsOptional() // 말 그대로 옵셔널로 만들어줌
  // @Equals('code factory')
  // @NotEquals('code factory')
  // @IsEmpty() // null || undefined || ''
  // @IsNotEmpty()
  // @IsIn(['action', 'fantasy'])
  // @IsNotIn(['action', 'fantasy'])

  // -- 타입 Validator
  // @IsBoolean()
  // @IsString()
  // @IsNumber()
  // @IsInt()
  // @IsArray()
  // @IsEnum(MovieGenre)
  // @IsDate // 실제 Date 객체
  // @IsDateString() // ISO 8601 String

  // -- 숫자 Validator
  // @IsDivisibleBy(5)
  // @IsPositive()
  // @IsNegative()
  // @Min(100)
  // @Max(100)

  // -- 문자 Validator
  // @Contains('code factory')
  // @NotContains('code factory')
  // @IsAlphanumeric() // 알파벳이나 숫자로만 이루어져 있는가?
  // @IsCreditCard() // 카드번호 검증
  // @IsHexColor()
  // @MaxLength(16)
  // @MinLength(4)
  // @IsUUID()
  // @IsLatLong()

  // -- 커스텀 Validator
  // @Validate(PasswordValidator, {
  //   message: '다른 에러 메세지',
  // })
  // @IsPasswordValid({
  //   message: '다른 메세지'
  // })
  // test: string;
}
