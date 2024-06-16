import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, MAX_LENGTH, MaxLength } from "class-validator";

export class AdminLoginResponseDto {

    @ApiProperty()
    @IsNumber()
    admin_id :number;

    @ApiProperty()
    @IsString()
    fullName: string;

    @ApiProperty()
    @IsString()
    email:string;

    @ApiProperty()
    @IsString()
    @MaxLength(10)
    phone:string;

    constructor(admin_id:number,firstName: string, email: string, phone: string) {
        this.admin_id = admin_id;
        this.fullName = firstName;
        this.email = email;
        this.phone = phone;
    }

    
}