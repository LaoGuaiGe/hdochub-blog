// 认证相关 DTO
import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
  IsOptional,
  Equals,
  ValidateIf,
} from 'class-validator';

// 注册 DTO
export class RegisterDto {
  @IsString()
  @MinLength(3, { message: '用户名长度需在 3-20 字符之间' })
  @MaxLength(20, { message: '用户名长度需在 3-20 字符之间' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名仅允许字母、数字、下划线' })
  username: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsString()
  @MinLength(8, { message: '密码长度需在 8-32 字符之间' })
  @MaxLength(32, { message: '密码长度需在 8-32 字符之间' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).+$/, {
    message: '密码需至少包含字母与数字',
  })
  password: string;

  @IsString()
  @ValidateIf((o) => o.password !== o.confirmPassword)
  @Equals('placeholder', { message: '两次输入的密码不一致' })
  @ValidateIf((o) => o.password === o.confirmPassword)
  @IsString()
  confirmPassword: string;

  @IsOptional()
  @IsString()
  captcha?: string;
}

// 登录 DTO
export class LoginDto {
  @IsString({ message: '账号不能为空' })
  account: string;

  @IsString({ message: '密码不能为空' })
  password: string;

  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}

// 修改密码 DTO
export class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(8, { message: '密码长度需在 8-32 字符之间' })
  @MaxLength(32, { message: '密码长度需在 8-32 字符之间' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).+$/, {
    message: '密码需至少包含字母与数字',
  })
  newPassword: string;

  @IsString()
  @ValidateIf((o) => o.newPassword !== o.confirmPassword)
  @Equals('placeholder', { message: '两次输入的密码不一致' })
  confirmPassword: string;
}

// 创建管理员 DTO（P2）
export class CreateAdminDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).+$/)
  password: string;

  @IsString()
  role: string; // ADMIN 或 SUPER_ADMIN
}
