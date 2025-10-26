declare module 'paystack-api' {
  interface PaystackConfig {
    secretKey?: string;
  }

  interface TransactionInitializeParams {
    email: string;
    amount: number;
    currency?: string;
    reference?: string;
    callback_url?: string;
    metadata?: any;
  }

  interface TransactionInitializeResponse {
    status: boolean;
    message: string;
    data: {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  }

  interface TransactionVerifyResponse {
    status: boolean;
    message: string;
    data: {
      id: number;
      domain: string;
      status: string;
      reference: string;
      amount: number;
      currency: string;
      paid_at: string;
      metadata?: any;
      [key: string]: any;
    };
  }

  interface PaystackClient {
    transaction: {
      initialize(params: TransactionInitializeParams): Promise<TransactionInitializeResponse>;
      verify(reference: string): Promise<TransactionVerifyResponse>;
    };
  }

  function paystack(secretKey: string): PaystackClient;

  export = paystack;
}
