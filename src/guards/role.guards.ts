import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorator/role.decorator';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    // console.log(user)
    console.log("inside guard")
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles) {
      return true;
    }
    if (!user) {
      return false;
    }
    // console.log("In the gaurd ")
    for (const role of roles) {
      if (user.loginType === role) {
        return true;
      }
    }
    return false;
  }
}