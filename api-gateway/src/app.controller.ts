import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AdminGuard } from './common/guards/admin.guard';
import {
  AddBatchDto,
  AddToCartDto,
  CalculateFifoDto,
  CreateCategoryDto,
  CreateCouponDto,
  CreateDivisionDto,
  CreateOrderDto,
  CreateProductDto,
  CreateSubCategoryDto,
  CreateVariantDto,
  GetProductsQueryDto,
  GetStocksQueryDto,
  LoginDto,
  PaginationQueryDto,
  RegisterUserDto,
  RegisterVendorDto,
  UpdateAccountDto,
  UpdateCartQuantityDto,
  UpdateCouponDto,
  UpdateDivisionDto,
  UpdateProductDto,
  UpdateVariantDto,
  ValidateCouponDto,
} from './dto/gateway.dto';

const isProduction = process.env.NODE_ENV === 'production';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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

  @Get('product/id/:id')
  getProductById(@Param('id') id: string) {
    return this.appService.rpcCall(
      this.appService.productService.getProductById({ id }),
    );
  }

  @Get('product/:slug')
  getProductBySlug(@Param('slug') slug: string) {
    return this.appService.rpcCall(
      this.appService.productService.getProductBySlug({ slug }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('product/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.appService.rpcCall(
      this.appService.productService.updateProduct({ id, ...dto }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('product/:id')
  deleteProduct(@Param('id') id: string) {
    return this.appService.rpcCall(
      this.appService.productService.deleteProduct({ id }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('product/:id/variant')
  createVariant(@Param('id') id: string, @Body() dto: CreateVariantDto) {
    return this.appService.rpcCall(
      this.appService.productService.createVariant({ id, ...dto }),
    );
  }

  @Get('product/:id/variants')
  getVariantsByProduct(@Param('id') id: string) {
    return this.appService.rpcCall(
      this.appService.productService.getVariantsByProduct({ id }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('product/variant/:id')
  updateVariant(@Param('id') id: string, @Body() dto: UpdateVariantDto) {
    return this.appService.rpcCall(
      this.appService.productService.updateVariant({ id, ...dto }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('product/variant/:id')
  deleteVariant(@Param('id') id: string) {
    return this.appService.rpcCall(
      this.appService.productService.deleteVariant({ id }),
    );
  }

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
  @Put('cart/update-quantity')
  updateCartQuantity(@Req() req: any, @Body() dto: UpdateCartQuantityDto) {
    const userId = req.user.userId;
    return this.appService.rpcCall(
      this.appService.cartService.updateQuantity({ userId, ...dto }),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cart/:variantId')
  removeFromCart(@Req() req: any, @Param('variantId') variantId: string) {
    const userId = req.user.userId;
    return this.appService.rpcCall(
      this.appService.cartService.removeFromCart({ userId, variantId }),
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

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('inventory/batch')
  addInventoryBatch(@Body() dto: AddBatchDto) {
    return this.appService.rpcCall(
      this.appService.inventoryService.addBatch(dto),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('inventory/stocks')
  getStocks(@Query() query: GetStocksQueryDto) {
    return this.appService.rpcCall(
      this.appService.inventoryService.getStocks(query),
    );
  }

  @Get('inventory/summary/:variantId')
  getVariantStockSummary(@Param('variantId') variantId: string) {
    return this.appService.rpcCall(
      this.appService.inventoryService.getVariantStockSummary({ variantId }),
    );
  }

  @Post('inventory/fifo-price')
  calculateFifoPrice(@Body() dto: CalculateFifoDto) {
    return this.appService.rpcCall(
      this.appService.inventoryService.calculateFifoPrice(dto),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('order')
  createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user.userId as string;
    return this.appService.rpcCall(
      this.appService.orderService.createOrder({
        userId,
        ...dto,
      }),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('order')
  getOrders(@Req() req: any, @Query() query: PaginationQueryDto) {
    const userId = req.user.userId as string;
    return this.appService.rpcCall(
      this.appService.orderService.getOrders({ userId, ...query }),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('order/single/:id')
  getOrderById(@Param('id') id: string) {
    return this.appService.rpcCall(
      this.appService.orderService.getOrderById({ id }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('order/coupon')
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.appService.rpcCall(
      this.appService.orderService.createCoupon(dto),
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
  @Put('order/coupon/:id')
  updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.appService.rpcCall(
      this.appService.orderService.updateCoupon({ id, ...dto }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('order/coupon/:id')
  deleteCoupon(@Param('id') id: string) {
    return this.appService.rpcCall(
      this.appService.orderService.deleteCoupon({ id }),
    );
  }

  @Post('order/coupon/validate')
  validateCoupon(
    @Req() req: any,
    @Query('userId') queryUserId: string,
    @Body() dto: ValidateCouponDto,
  ) {
    const userId = req.user?.userId || queryUserId || 'GUEST';
    return this.appService.rpcCall(
      this.appService.orderService.validateCouponForUser({
        userId,
        code: dto.code,
        items: dto.items,
      }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('order/division')
  createDivision(@Body() dto: CreateDivisionDto) {
    return this.appService.rpcCall(
      this.appService.divisionService.createDivision(dto),
    );
  }

  @Get('order/divisions')
  getAllDivisions() {
    return this.appService.rpcCall(
      this.appService.divisionService.getAllDivisions(),
    );
  }

  @Get('order/division/:id')
  getDivisionById(@Param('id') id: string) {
    return this.appService.rpcCall(
      this.appService.divisionService.getDivisionById({ id }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('order/division/:id')
  updateDivision(@Param('id') id: string, @Body() dto: UpdateDivisionDto) {
    return this.appService.rpcCall(
      this.appService.divisionService.updateDivision({ id, ...dto }),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('order/division/:id')
  deleteDivision(@Param('id') id: string) {
    return this.appService.rpcCall(
      this.appService.divisionService.deleteDivision({ id }),
    );
  }
}
