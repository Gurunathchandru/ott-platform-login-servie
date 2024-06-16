import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, MAX_LENGTH, MaxLength } from "class-validator";

export class CustomerLoginResponseDto {

    @ApiProperty()
    @IsNumber()
    customer_id :string;

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

    constructor(firstName: string, email: string, phone: string) {
        this.fullName = firstName;
        this.email = email;
        this.phone = phone;
    }

    
}