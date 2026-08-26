import { Injectable } from '@nestjs/common';

type ServiceName =
  'user' | 'product' | 'cart' | 'order' | 'inventory' | 'division';

type QueryValue = string | number | boolean | undefined | null;

@Injectable()
export class AppService {
  private readonly serviceUrls: Record<ServiceName, string> = {
    user: process.env.USER_SERVICE_URL ?? 'http://localhost:3001',
    product: process.env.PRODUCT_SERVICE_URL ?? 'http://localhost:3002',
    cart: process.env.CART_SERVICE_URL ?? 'http://localhost:3003',
    inventory: process.env.INVENTORY_SERVICE_URL ?? 'http://localhost:3004',
    order: process.env.ORDER_SERVICE_URL ?? 'http://localhost:3005',
    division:
      process.env.DIVISION_SERVICE_URL ??
      process.env.ORDER_SERVICE_URL ??
      'http://localhost:3005',
  };

  public userService = {
    registerUser: (data: any) =>
      this.httpRequest('user', '/auth/register', 'POST', data),
    loginUser: (data: any) =>
      this.httpRequest('user', '/auth/login', 'POST', data),
    registerVendor: (data: any) =>
      this.httpRequest('user', '/auth/vendor/register', 'POST', data),
    loginVendor: (data: any) =>
      this.httpRequest('user', '/auth/vendor/login', 'POST', data),
    getSettings: (data: any) =>
      this.httpRequest('user', `/account/${data.vendorId}`, 'GET'),
    updateSettings: (data: any) =>
      this.httpRequest('user', '/account/update', 'POST', data),
  };

  public productService = {
    createCategory: (data: any) =>
      this.httpRequest('product', '/product/category', 'POST', data),
    getCategories: (query: any) =>
      this.httpRequest(
        'product',
        '/product/categories',
        'GET',
        undefined,
        query,
      ),
    getCategoryById: (data: { id: string }) =>
      this.httpRequest(
        'product',
        `/product/category/${encodeURIComponent(data.id)}`,
        'GET',
      ),
    updateCategory: (data: any) =>
      this.httpRequest(
        'product',
        `/product/category/${encodeURIComponent(data.id)}`,
        'PUT',
        data,
      ),
    deleteCategory: (data: { id: string }) =>
      this.httpRequest(
        'product',
        `/product/category/${encodeURIComponent(data.id)}`,
        'DELETE',
      ),

    createSubCategory: (data: any) =>
      this.httpRequest('product', '/product/subcategory', 'POST', data),
    getSubCategories: (query: any) =>
      this.httpRequest(
        'product',
        '/product/subcategories',
        'GET',
        undefined,
        query,
      ),
    getSubCategoryById: (data: { id: string }) =>
      this.httpRequest(
        'product',
        `/product/subcategory/${encodeURIComponent(data.id)}`,
        'GET',
      ),
    updateSubCategory: (data: any) =>
      this.httpRequest(
        'product',
        `/product/subcategory/${encodeURIComponent(data.id)}`,
        'PUT',
        data,
      ),
    deleteSubCategory: (data: { id: string }) =>
      this.httpRequest(
        'product',
        `/product/subcategory/${encodeURIComponent(data.id)}`,
        'DELETE',
      ),

    createProduct: (data: any) =>
      this.httpRequest('product', '/product', 'POST', data),
    getProducts: (query: any) =>
      this.httpRequest('product', '/product', 'GET', undefined, query),
    getProductById: (data: { id: string }) =>
      this.httpRequest(
        'product',
        `/product/id/${encodeURIComponent(data.id)}`,
        'GET',
      ),
    getProductBySlug: (data: { slug: string }) =>
      this.httpRequest(
        'product',
        `/product/${encodeURIComponent(data.slug)}`,
        'GET',
      ),
    updateProduct: (data: any) =>
      this.httpRequest(
        'product',
        `/product/${encodeURIComponent(data.id)}`,
        'PUT',
        data,
      ),
    deleteProduct: (data: { id: string }) =>
      this.httpRequest(
        'product',
        `/product/${encodeURIComponent(data.id)}`,
        'DELETE',
      ),

    createVariant: (data: any) =>
      this.httpRequest(
        'product',
        `/product/${encodeURIComponent(data.id)}/variant`,
        'POST',
        data,
      ),
    getVariantsByProduct: (data: { id: string }) =>
      this.httpRequest(
        'product',
        `/product/${encodeURIComponent(data.id)}/variants`,
        'GET',
      ),
    updateVariant: (data: any) =>
      this.httpRequest(
        'product',
        `/product/variant/${encodeURIComponent(data.id)}`,
        'PUT',
        data,
      ),
    deleteVariant: (data: { id: string }) =>
      this.httpRequest(
        'product',
        `/product/variant/${encodeURIComponent(data.id)}`,
        'DELETE',
      ),
  };

  public cartService = {
    getCart: (data: any) =>
      this.httpRequest('cart', '/cart', 'GET', undefined, {
        userId: data.userId,
      }),
    addToCart: (data: any) =>
      this.httpRequest('cart', '/cart/add', 'POST', data),
    updateQuantity: (data: any) =>
      this.httpRequest('cart', '/cart/update-quantity', 'PUT', data),
    removeFromCart: (data: any) =>
      this.httpRequest(
        'cart',
        `/cart/${encodeURIComponent(data.variantId)}`,
        'DELETE',
        undefined,
        {
          userId: data.userId,
        },
      ),
    clearCart: (data: any) =>
      this.httpRequest('cart', '/cart', 'DELETE', { userId: data.userId }),
  };

  public inventoryService = {
    addBatch: (data: any) =>
      this.httpRequest('inventory', '/inventory/batch', 'POST', data),
    getStocks: (query: any) =>
      this.httpRequest(
        'inventory',
        '/inventory/stocks',
        'GET',
        undefined,
        query,
      ),
    getVariantStockSummary: (data: { variantId: string }) =>
      this.httpRequest(
        'inventory',
        `/inventory/summary/${encodeURIComponent(data.variantId)}`,
        'GET',
      ),
    calculateFifoPrice: (data: any) =>
      this.httpRequest('inventory', '/inventory/fifo-price', 'POST', data),
  };

  public orderService = {
    createOrder: (data: { userId?: string; [key: string]: any }) => {
      const { userId, ...body } = data;
      return this.httpRequest(
        'order',
        '/order',
        'POST',
        body,
        userId ? { userId } : undefined,
      );
    },
    getOrders: (data: any) =>
      this.httpRequest('order', '/order', 'GET', undefined, {
        userId: data.userId,
        ...(data.page ? { page: data.page } : {}),
        ...(data.limit ? { limit: data.limit } : {}),
      }),
    getOrderById: (data: { id: string }) =>
      this.httpRequest(
        'order',
        `/order/single/${encodeURIComponent(data.id)}`,
        'GET',
      ),

    createCoupon: (data: any) =>
      this.httpRequest('order', '/order/coupon', 'POST', data),
    getCoupons: (query: any) =>
      this.httpRequest('order', '/order/coupon', 'GET', undefined, query),
    getCouponById: (data: { id: string }) =>
      this.httpRequest(
        'order',
        `/order/coupon/${encodeURIComponent(data.id)}`,
        'GET',
      ),
    updateCoupon: (data: any) =>
      this.httpRequest(
        'order',
        `/order/coupon/${encodeURIComponent(data.id)}`,
        'PUT',
        data,
      ),
    deleteCoupon: (data: { id: string }) =>
      this.httpRequest(
        'order',
        `/order/coupon/${encodeURIComponent(data.id)}`,
        'DELETE',
      ),

    validateCouponForUser: (data: {
      userId: string;
      code: string;
      items?: any[];
    }) =>
      this.httpRequest(
        'order',
        '/order/coupon/validate',
        'POST',
        { code: data.code, items: data.items },
        data.userId ? { userId: data.userId } : undefined,
      ),
  };

  public divisionService = {
    createDivision: (data: any) =>
      this.httpRequest('division', '/division', 'POST', data),
    getAllDivisions: () => this.httpRequest('division', '/division', 'GET'),
    getDivisionById: (data: { id: string }) =>
      this.httpRequest(
        'division',
        `/division/${encodeURIComponent(data.id)}`,
        'GET',
      ),
    updateDivision: (data: any) =>
      this.httpRequest(
        'division',
        `/division/${encodeURIComponent(data.id)}`,
        'PUT',
        data,
      ),
    deleteDivision: (data: { id: string }) =>
      this.httpRequest(
        'division',
        `/division/${encodeURIComponent(data.id)}`,
        'DELETE',
      ),
  };

  async rpcCall<T>(value: Promise<T> | T): Promise<T> {
    return await Promise.resolve(value as Promise<T> | T);
  }

  private async httpRequest<T>(
    service: ServiceName,
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    query?: Record<string, QueryValue>,
  ): Promise<T> {
    const baseUrl = this.serviceUrls[service];
    const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url.toString(), {
      method,
      headers,
      body:
        body !== undefined && method !== 'GET'
          ? JSON.stringify(body)
          : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP ${method} ${url.toString()} failed with status ${response.status}: ${errorText}`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  }
}
