import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsNotEmpty, IsNumber, IsPhoneNumber, IsString, Length, Matches } from "class-validator";
import * as jf from 'joiful';

export class CustomerManageProfileDto {
  @ApiProperty()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty()
  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
  @Length(8, 16)
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @Matches(/^\d{10}$/)
  @IsNotEmpty()
  phone: string;


  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsDateString()
  dateOfOnBoarding: Date;

  @ApiProperty()
  @IsString()
  contentPreference: string;

  @ApiProperty()
  @IsString()
  languagePreference: string;
}