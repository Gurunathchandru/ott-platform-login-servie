import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminDataDto } from './dto/admin.dto';
import { AdminLoginDto } from './dto/admin-login.dto';



    @ApiTags("admin functionalities")
// @UseGuards(CustomerMiddleware,RolesGuard)
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService:AdminService){}

    @ApiCreatedResponse({description: 'adding new admin'})
    @ApiOperation({summary:'adding admin details'})
    @Post('add-newadmin')
    async signUp(@Body()adminDataDto:AdminDataDto) {
        return await this.adminService.addAdmin(adminDataDto);
    }

    @ApiCreatedResponse({description: 'get admin details'})
    @ApiOperation({summary:'get admin details'})
    @ApiBody({type:AdminDataDto})
    // @Roles([UserType.CUSTOMER]) 
    @Get('get')
    async get(@Query('email')email:string) {
        return await this.adminService.getCustomers(email); 
    }

    // @ApiOperation({summary:"login admin and amster_admin based on usertype"})
    // @ApiCreatedResponse({description:"login successful"})
    // @ApiBody({type:AdminLoginDto})
    // @Post('login')
    // async login (@Body() adminLoginDto: AdminLoginDto ) {
    //     return await this.adminService.login(adminLoginDto);
    // }
}
