export const API = import.meta.env.VITE_API_URL;
// export const API ='http://127.0.0.1:8000/api';
export const LOGIN = `${API}/login`;
export const LIST_USER = `${API}/getListUser`;
export const REGISTER = `${API}/register`;
export const RESET_PASSWORD = `${API}/reset-password`;
export const FORGOT_PASSWORD = `${API}/forgot-password`;
export const CHANGE_PASSWORD = `${API}/change-password`;
export const CHECK_PASSWORD = `${API}/check-password`;
export const ACCOUNT_TYPE = `${API}/account-type`;

export const UPDATE_USER = `${API}/update-user`;
export const SEND_VERIFY_EMAIL = `${API}/send-verify-email`;
export const CUSTOMER = `${API}/customer`;
export const SUPPLIER = `${API}/supplier`;
export const BUDGET = `${API}/budgets`;
export const BUDGET_BY_SUPPLIER = `${API}/budgets-by-supplier`;
export const BUDGET_CONTRACT = `${API}/budget-contract`;

export const CONTRACT = `${API}/contracts`;
export const CONTRACT_FILTERED = `${API}/contracts/filtered`;
export const BILL = `${API}/bils`;
export const BILL_FILTERED = `${API}/bills/filter`;
export const PAYMENT = `${API}/payments`
export const PAYMENT_BY_CUSTOMER = `${API}/payments-by-customer`

export const OVERVIEW_CUSTOMER = `${API}/overview/customer`
export const OVERVIEW_SUPPLIER = `${API}/overview/supplier`
export const DASHBOARD = `${API}/dashboard`










