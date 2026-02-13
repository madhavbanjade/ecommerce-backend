import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class googleAuthGuard extends AuthGuard("google"){
}