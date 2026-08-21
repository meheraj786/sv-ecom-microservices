import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Res,
  Req,
  UseGuards,
  Put,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AdminGuard } from './common/guards/admin.guard';
import {
  RegisterUserDto,
  RegisterVendorDto,
  LoginDto,
  UpdateAccountDto,
  CreateCategoryDto,
  CreateSubCategoryDto,
  CreateProductDto,
  GetProductsQueryDto,
  PaginationQueryDto,
  AddToCartDto,
  ValidateCouponDto,
  UpdateCouponDto,
  CreateCouponDto,
} from './dto/gateway.dto';

const isProduction = process.env.NODE_ENV === 'production';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  // =================================-------------------
  // 1. USER & AUTHENTICATION ENDPOINTS (Sets Cookies)
  // =================================-------------------

  @Post('auth/register')
  registerUser(@Body() dto: RegisterUserDto) {
    return this.appService.rpcCall(
      this.appService.userService.registerUser(dto),
    );
  }

  @Post('auth/login')
  async loginUser(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result: any = await this.appService.rpcCall(
      this.appService.userService.loginUser(dto),
    );

    response.cookie('token', result.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return { message: result.message, user: result.user };
  }

  @Post('auth/vendor/register')
  registerVendor(@Body() dto: RegisterVendorDto) {
    return this.appService.rpcCall(
      this.appService.userService.registerVendor(dto),
    );
  }

  @Post('auth/vendor/login')
  async loginVendor(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result: any = await this.appService.rpcCall(
      this.appService.userService.loginVendor(dto),
    );

    response.cookie('token', result.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return { message: result.message, vendor: result.vendor };
  }

  @Post('auth/logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });
    return { message: 'Logged out successfully' };
  }

  // =================================-------------------
  // 2. STOREFRONT CMS SETTINGS
  // =================================-------------------

  @Get('account/:vendorId')
  getStoreSettings(@Param('vendorId') vendorId: string) {
    return this.appService.rpcCall(
      this.appService.userService.getSettings({ vendorId }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('account/update')
  updateStoreSettings(@Req() req: any, @Body() dto: UpdateAccountDto) {
    const vendorId = req.user.userId as string;
    return this.appService.rpcCall(
      this.appService.userService.updateSettings({ vendorId, ...dto }),
    );
  }

  // =================================-------------------
  // 3. PRODUCT CATALOG ENDPOINTS
  // =================================-------------------

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('product/category')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.appService.rpcCall(
      this.appService.productService.createCategory(dto),
    );
  }

  @Get('product/categories')
  getCategories(@Query() query: PaginationQueryDto) {
    return this.appService.rpcCall(
      this.appService.productService.getCategories(query),
    );
  }

  @Get('product/category/:id')
  getCategoryById(@Param('id') id: string) {
    return this.appService.rpcCall(
      this.appService.productService.getCategoryById({ id }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('product/category/:id')
  updateCategory(@Param('id') id: string, @Body() dto: CreateCategoryDto) {
    return this.appService.rpcCall(
      this.appService.productService.updateCategory({ id, ...dto }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('product/category/:id')
  deleteCategory(@Param('id') id: string) {
    return this.appService.rpcCall(
      this.appService.productService.deleteCategory({ id }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('product/subcategory')
  createSubCategory(@Body() dto: CreateSubCategoryDto) {
    return this.appService.rpcCall(
      this.appService.productService.createSubCategory(dto),
    );
  }

  @Get('product/subcategories')
  getSubCategories(@Query() query: PaginationQueryDto) {
    return this.appService.rpcCall(
      this.appService.productService.getSubCategories(query),
    );
  }

  @Get('product/subcategory/:id')
  getSubCategoryById(@Param('id') id: string) {
    return this.appService.rpcCall(
      this.appService.productService.getSubCategoryById({ id }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('product/subcategory/:id')
  updateSubCategory(
    @Param('id') id: string,
    @Body() dto: CreateSubCategoryDto,
  ) {
    return this.appService.rpcCall(
      this.appService.productService.updateSubCategory({ id, ...dto }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('product/subcategory/:id')
  deleteSubCategory(@Param('id') id: string) {
    return this.appService.rpcCall(
      this.appService.productService.deleteSubCategory({ id }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('product')
  createProduct(@Body() dto: CreateProductDto) {
    return this.appService.rpcCall(
      this.appService.productService.createProduct(dto),
    );
  }

  @Get('product')
  getProducts(@Query() query: GetProductsQueryDto) {
    return this.appService.rpcCall(
      this.appService.productService.getProducts(query),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('product/:id')
  deleteProduct(@Param('id') id: string) {
    return this.appService.rpcCall(
      this.appService.productService.deleteProduct({ id }),
    );
  }

  @Get('product/:slug')
  getProductBySlug(@Param('slug') slug: string) {
    return this.appService.rpcCall(
      this.appService.productService.getProductBySlug({ slug }),
    );
  }

  // =================================-------------------
  // 4. SHOPPING CART ENDPOINTS
  // =================================-------------------

  @UseGuards(JwtAuthGuard)
  @Get('cart')
  getCart(@Req() req: any) {
    const userId = req.user.userId as string;
    return this.appService.rpcCall(
      this.appService.cartService.getCart({ userId }),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('cart/add')
  addToCart(@Req() req: any, @Body() dto: AddToCartDto) {
    const userId = req.user.userId;
    return this.appService.rpcCall(
      this.appService.cartService.addToCart({ userId, ...dto }),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cart/:productId')
  removeFromCart(@Req() req: any, @Param('productId') productId: string) {
    const userId = req.user.userId;
    return this.appService.rpcCall(
      this.appService.cartService.removeFromCart({ userId, productId }),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cart')
  clearCart(@Req() req: any) {
    const userId = req.user.userId;
    return this.appService.rpcCall(
      this.appService.cartService.clearCart({ userId }),
    );
  }

  // =================================-------------------
  // 5. ORDER CHECKOUT & PURCHASES
  // =================================-------------------

  @UseGuards(JwtAuthGuard)
  @Post('order')
  createOrder(@Req() req: any) {
    const userId = req.user.userId;
    return this.appService.rpcCall(
      this.appService.orderService.createOrder({ userId }),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('order')
  getOrders(@Req() req: any, @Query() query: PaginationQueryDto) {
    const userId = req.user.userId;
    return this.appService.rpcCall(
      this.appService.orderService.getOrders({ userId, ...query }),
    );
  }

  // =================================-------------------
  // 6. COUPON ENDPOINTS (Admin)
  // =================================-------------------

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('order/coupon')
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.appService.rpcCall(
      this.appService.orderService.createCoupon(dto),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('order/coupon/:id')
  updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.appService.rpcCall(
      this.appService.orderService.updateCoupon({ id, ...dto }),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('order/coupon/validate')
  validateCoupon(@Req() req: any, @Body() dto: ValidateCouponDto) {
    const userId = req.user.userId;
    return this.appService.rpcCall(
      this.appService.orderService.validateCouponForUser({
        userId,
        code: dto.code,
      }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('order/coupon')
  getCoupons(@Query() query: PaginationQueryDto) {
    return this.appService.rpcCall(
      this.appService.orderService.getCoupons(query),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('order/coupon/:id')
  getCouponById(@Param('id') id: string) {
    return this.appService.rpcCall(
      this.appService.orderService.getCouponById({ id }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('order/coupon/:id')
  deleteCoupon(@Param('id') id: string) {
    return this.appService.rpcCall(
      this.appService.orderService.deleteCoupon({ id }),
    );
  }
}
