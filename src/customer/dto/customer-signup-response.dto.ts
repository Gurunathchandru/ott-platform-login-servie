import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString, Length, Matches } from "class-validator";

export class CustomerSignupDataResponseDto{

    @ApiProperty()
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    email:string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fullName:string;

    @ApiProperty()
    @IsString()
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
    @Length(8,16)
    @IsNotEmpty()
    password:string;

    @ApiProperty()
    @IsPhoneNumber()
    @IsNotEmpty()
    phone:number;

    @ApiProperty()
    @IsString()
    gender?:string;

    @ApiProperty()
    @IsString()
    DOB?:Date;

    @ApiProperty()
    @IsString()
    @Length(10.50)
    address?:string;

    constructor(email:string,fullName:string,password:string,phone:number,DOB:Date,address:string,gender:string){
        this.email = email;
        this.fullName = fullName;
        this.password = password;
        this.phone = phone;
        this.DOB= DOB;
        this.gender = gender;
        this.address = address;
    }
}