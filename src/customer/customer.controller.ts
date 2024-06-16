import { Body, Controller, Delete, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'; // Import ApiParam instead of ApiQuery
import { CustomerSignupDataDto } from './dto/customer-signup.dto';
import Joi from 'joi';
import { CustomerManageProfileDto } from './dto/customer-manage-profile.dto';
import { CustomerLoginDto } from './dto/customer-login-request.dto';
import { Roles } from '../decorator/role.decorator';
import { UserType } from '../constant/user-type.constant';
import { CustomerMiddleware } from '../constant/middleware/customer.middleware';
import { RolesGuard } from '../guards/role.guards';
import { DBService } from 'src/external-entities/db.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags("customer functionalities")
@UseGuards(CustomerMiddleware, RolesGuard)
@Controller('customer')
export class CustomerController {
    constructor(private readonly customerService: CustomerService) { }

    @ApiCreatedResponse({ description: 'signUp for Customers' })
    @ApiOperation({ summary: 'adding Customer details' })
    @Post('sign')
    async signUp(@Body() customerSignupDto: CustomerManageProfileDto) {
        return await this.customerService.singUp(customerSignupDto);
    }

    @ApiCreatedResponse({ description: 'manage profile for customers' })
    @ApiOperation({ summary: 'manage Customer details' })
    @ApiBody({ type: CustomerManageProfileDto })
    @Roles([UserType.CUSTOMER])
    @Get('get')
    async get(@Query('customerId') customerId: string) {
        return await this.customerService.getCustomers(customerId);
    }

    @ApiOperation({ summary: "login customer and admin based on usertype" })
    @ApiCreatedResponse({ description: "login successful" })
    @ApiBody({ type: CustomerLoginDto })
    @Post('login')
    async login(@Body() customerLoginDto: CustomerLoginDto) {
        return await this.customerService.login(customerLoginDto);
    }

    @ApiOperation({ summary: "reset pass word" })
    @ApiCreatedResponse({ description: "password reset" })
    @ApiBody({ type: CustomerLoginDto })
    @Roles([UserType.CUSTOMER])
    @Post('reset')
    async resetPassword(@Body() data: ResetPasswordDto, @Req() req: Request) {
        return await this.customerService.resetPassword(data, req);
    }

    @ApiOperation({ summary: "logout" })
    @ApiCreatedResponse({ description: "logout" })
    @ApiBody({ type: CustomerLoginDto })
    @Roles([UserType.CUSTOMER])
    @Delete('logout')
    async logout(@Req() req: Request) {
        return await this.customerService.logout(req);
    }
}
