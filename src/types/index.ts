export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager';
  status: 'active' | 'inactive';
  created_at: string;
  avatar?: string;
}

export interface Customer {
  id: string;
  name: string;
  zalo: string;
  facebook: string;
  phone_number: string;
  address: string;
  product_type: 'legal' | 'illegal' | 'middle-illegal';
  account_type_id: string;
  account_type_name:string;
  note: string;
  rate: number;
}

export interface Supplier {
  id: string;
  name: string;
  zalo: string;
  phoneNumber: string;
  address: string;
  note: string;
}

export interface Budget {
  id: string;
  supplier_id: string;
  account_type_id: string;
  account_type_name:string;
  money: number;
  product_type: 'legal' | 'illegal' |'middle-illegal';
  supplier_rate: number;
  customer_rate: number;
  status: 'active' | 'inactive';
  note: string;
  date: string;
}

export interface AccountType {
  id: string;
  name: string;
  description: string;
  note: string;
}

export interface Contract {
  id: string;
  date: string;
  customer_id: string;
  customer_name:string;
  supplier_name:string;
  account_type_id:string;
  account_type_name: string;
  product: string;
  product_type: 'legal' | 'illegal' | 'middle-illegal';
  total_cost: number;
  customer_rate: number;
  supplier_rate: number;
  note: string;
  budget_id: string;  
}

export interface Bill {
  id: string;
  date: string;
  customer_id: string;
  customer_name: string;
  product: string;
  total_money: number;
  paid_amount: number;
  debt_amount: number;
  deposit_amount: number; // Tiền cọc
  status: 'deposit' | 'debt' | 'completed';
  note: string;
}

export interface Payment {
  id: string;
  bill_id: string;
  date: string;
  amount: number;
  method: string;
  note: string;
  is_deposit:number;
}

export interface BudgetContract {
  id: string;
  account_type_name: string;
  supplier_name: string;
  budget_money: number;
  customer_rate: number;
  supplier_rate: number;
  used_budget: number;
}