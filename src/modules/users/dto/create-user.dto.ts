import { Gender, Role } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'UserName is required' })
  @IsString()
  @MinLength(3, { message: 'UserName must be at least 3 characters long' })
  @MaxLength(30, { message: 'UserName must not exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'userName can only contain letters, numbers, underscores, and hyphens',
  })
  username: string;

  @IsNotEmpty({ message: 'Fullname is required' })
  @IsString()
  @MinLength(3, { message: 'Fullname must be at least 3 characters long' })
  @MaxLength(30, { message: 'Fullname must not exceed 30 characters' })
  fullname: string;

  @IsString()
  @MinLength(3, { message: ' Gender must be at least 3 characters long' })
 
  gender: Gender;

  @IsNotEmpty({ message: 'Contact is required' })
  @IsString()
  contact: string;

  @IsNotEmpty({ message: 'DOB is required' })
  @IsDate()
   @Type(() => Date) 
  dob: Date;



  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please Provide a valid email address' })
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Please provide a valid email address',
  })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?&])[A-Za-z\d@$!%?&]{8,}$/,
    {
      message:
        'Password must contain at least 8 characters, one uppercase, one number, and one special character (@$!%*?&)',
    },
  )
  password: string;

  @IsOptional()
  @IsString()
  role?: Role; // ✅ allow role
}
