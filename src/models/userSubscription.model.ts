export interface UserSubscription {
  UserID: string; // UUID - Foreign Key
  SubscriptionID: string; // UUID - Foreign Key
  StartDate: string; // Date (YYYY-MM-DD)
  EndDate: string; // Date (YYYY-MM-DD)
  ExhaustDate?: string | null; // Date or null
  ActualEndDate?: string | null; // Date or null
  PaymentAmount: number; // Amount paid
  PaymentCurrency: string; // Currency (e.g., USD, INR)
  CreatedOn: string; // ISO Date-Time
  CreatedBy: string; // User's First Name
  LastModifiedOn: string; // ISO Date-Time
  LastModifiedBy: string; // User's First Name
  PaymentDuration: number; // Duration from Subscription table (in months)
  Status: number; // 0 = Expired, 1 = Active, 2 = Exhausted
  TransactionID: string; // Transaction ID from Payment Gateway
  PaymentGatewayData: string; // Additional Payment Gateway Data
}
