import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsIn, IsNotEmpty, IsString, Length } from "class-validator";

export class AdminLoginDto {
    @ApiProperty({description: 'The username of the customer who wants to login'})
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    email:string;

    @ApiProperty({description: 'This is the user\'s password'})
    @IsString()
    @IsNotEmpty()
    password: string;


    @ApiProperty({description: 'Key to identify if it is Customer login or admin login'})
    @IsString()
    @IsIn(['Master-Admin', 'Admin'])
    userType: string; 

}