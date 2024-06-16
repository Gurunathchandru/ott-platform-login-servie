import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumber, IsPhoneNumber, IsString, Length, Matches } from "class-validator";

export class CustomerManageProfileResponseDto{


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
    @Length(5,10)
    gender?:string;

    @ApiProperty()
    @IsString()
    DOB?:Date;

    @ApiProperty()
    @IsString()
    address?:string;

    @ApiProperty()
    @IsString()
    country?:string;

    @ApiProperty()
    @IsString()
    dateOfOnBoarding?:Date;

    @ApiProperty()
    @IsString()
    contentPreferences?:string[];

    @ApiProperty()
    @IsString()
    languagePreferences?:string[];


    constructor(email:string,fullName:string,password:string,phone:number,gender:string,address:string,DOB:Date,
                country:string,dateOfOnBoarding:Date,contentPreferences:string[],languagePreferences:string[]){
        this.email = email;
        this.fullName = fullName;
        this.password = password;
        this.phone = phone;
        this.gender = gender;
        this.address = address;
        this.DOB=DOB;
        this.country = country;
        this.dateOfOnBoarding = dateOfOnBoarding;
        this.contentPreferences = contentPreferences;
        this.languagePreferences = languagePreferences;
    }
}