import Cookies from 'js-cookie';
import { ACCOUNT_TYPE, BILL_FILTERED, BUDGET_BY_SUPPLIER, BUDGET_CONTRACT, CONTRACT_FILTERED, CUSTOMER, DASHBOARD, LIST_USER, OVERVIEW_CUSTOMER, OVERVIEW_SUPPLIER, PAYMENT_BY_CUSTOMER, SUPPLIER } from '../config/API';
import { AccountType, Customer, Payment, Supplier, User } from '../types';
export const fetchUsers = async (): Promise<User[]> => {
    try {
        const accessToken = Cookies.get("accessToken");
        const userCookie = Cookies.get("user");
        if (!accessToken || !userCookie) return [];

        // Parse cookie user từ JSON string
        const user = JSON.parse(userCookie);
        const role = user.role;

        const response = await fetch(LIST_USER, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ role }), // nếu backend cần
        });

        const data = await response.json();

        if (response.ok) {
            return data.list_user; // danh sách user từ API
        } else {
            console.error("Fetch users failed:", data.message);
            return [];
        }
    } catch (err) {
        console.error("Error fetching users:", err);
        return [];
    }
};
export const fetchAccountType = async (): Promise<AccountType[]> => {
    try {
        const accessToken = Cookies.get("accessToken");
        if (!accessToken) return [];
        const response = await fetch(ACCOUNT_TYPE, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();        
        if (response.ok) {
            return data; // danh sách accout type từ API
        } else {
            console.error("Fetch accout type failed:", data.message);
            return [];
        }
    } catch (err) {
        console.error("Error fetching accout type:", err);
        return [];
    }
};
export const fetchCustomer = async (): Promise<Customer[]> => {
    try {
        const accessToken = Cookies.get("accessToken");
        if (!accessToken) return [];
        const response = await fetch(CUSTOMER, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();
        if (response.ok) {
            return data; // danh sách accout type từ API
        } else {
            console.error("Fetch accout type failed:", data.message);
            return [];
        }
    } catch (err) {
        console.error("Error fetching accout type:", err);
        return [];
    }
};
export const fetchSupplier = async (): Promise<Supplier[]> => {
    try {
        const accessToken = Cookies.get("accessToken");
        if (!accessToken) return [];
        const response = await fetch(SUPPLIER, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();
        if (response.ok) {
            return data; // danh sách accout type từ API
        } else {
            console.error("Fetch accout type failed:", data.message);
            return [];
        }
    } catch (err) {
        console.error("Error fetching accout type:", err);
        return [];
    }
};
export const fetchBudgetBySupplier = async (
    supplierId: string,
    params?: {
        status?: string;
        product_type?: string;
        sort_by?: string;
        sort_order?: "asc" | "desc";
        page?: number;
        limit?: number;
    }
): Promise<any> => {  // có paginate nên không phải Array thuần
    try {
        const accessToken = Cookies.get("accessToken");
        if (!accessToken) return [];

        // Build query params
        const query = new URLSearchParams();
        if (params?.status) query.append("status", params.status);
        if (params?.product_type) query.append("product_type", params.product_type);
        if (params?.sort_by) query.append("sort_by", params.sort_by);
        if (params?.sort_order) query.append("sort_order", params.sort_order);
        if (params?.page) query.append("page", params.page.toString());
        if (params?.limit) query.append("limit", params.limit.toString());

        const response = await fetch(
            `${BUDGET_BY_SUPPLIER}/${supplierId}?${query.toString()}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
            }
        );

        const data = await response.json();
        if (response.ok) {
            return data; // data sẽ là paginate object
        } else {
            console.error("Fetch budget failed:", data.message);
            return [];
        }
    } catch (err) {
        console.error("Error fetching budget:", err);
        return [];
    }
};
export const fetchFilteredContracts = async (
    params?: {
        customer_id?: string | number;
        supplier_id?: string | number;
        account_type_id?: string | number;
        product_type?: string; // ✅ thêm product_type
        from_date?: string;
        to_date?: string;
        page?: number;
        per_page?: number;
    }
): Promise<any> => {
    try {
        const accessToken = Cookies.get("accessToken");
        if (!accessToken) return [];

        const query = new URLSearchParams();

        if (params?.customer_id) query.append("customer_id", params.customer_id.toString());
        if (params?.supplier_id) query.append("supplier_id", params.supplier_id.toString());
        if (params?.account_type_id) query.append("account_type_id", params.account_type_id.toString());

        // ✅ append product_type nếu có
        if (params?.product_type) query.append("product_type", params.product_type);

        if (params?.from_date) query.append("from_date", params.from_date);
        if (params?.to_date) query.append("to_date", params.to_date);
        if (params?.page) query.append("page", params.page.toString());
        if (params?.per_page) query.append("per_page", params.per_page.toString());

        const response = await fetch(
            `${CONTRACT_FILTERED}?${query.toString()}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
            }
        );

        const data = await response.json();

        if (response.ok) {
            return data; // { data: [...], pagination: {...} }
        } else {
            console.error("Fetch filtered contracts failed:", data.message);
            return [];
        }
    } catch (error) {
        console.error("Error fetching filtered contracts:", error);
        return [];
    }
};

export const fetchBudgetContract = async (): Promise<any[]> => {
    try {
        const accessToken = Cookies.get("accessToken");
        if (!accessToken) return [];
        const response = await fetch(BUDGET_CONTRACT, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();
        if (response.ok) {
            return data.data; // danh sách accout type từ API
        } else {
            console.error("Fetch budget contract failed:", data.message);
            return [];
        }
    } catch (err) {
        console.error("Error fetching budget contract:", err);
        return [];
    }
};

export const fetchFilteredBills = async (
    params?: {
        customer_id?: string | number;
        status?: string;
        from_date?: string;
        to_date?: string;
        page?: number;
        per_page?: number;
    }
): Promise<any> => {
    try {
        const accessToken = Cookies.get("accessToken");
        if (!accessToken) return [];

        const query = new URLSearchParams();

        if (params?.customer_id && params.customer_id !== "all") {
            query.append("customer_id", params.customer_id.toString());
        }

        if (params?.status && params.status !== "all") {
            query.append("status", params.status.toString());
        }
        if (params?.from_date) query.append("from_date", params.from_date);
        if (params?.to_date) query.append("to_date", params.to_date);
        if (params?.page) query.append("page", params.page.toString());
        if (params?.per_page) query.append("per_page", params.per_page.toString());

        const response = await fetch(
            `${BILL_FILTERED}?${query.toString()}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
            }
        );

        const data = await response.json();

        if (response.ok) {
            return data; // { data: [...], pagination: {...} }
        } else {
            console.error("Fetch filtered contracts failed:", data.message);
            return [];
        }
    } catch (error) {
        console.error("Error fetching filtered contracts:", error);
        return [];
    }
};
export const fetchPaymentByCustomer = async (
    customer_id: string | number,
    fromDate: string,
    toDate: string
): Promise<Payment[]> => {

    try {
        const accessToken = Cookies.get("accessToken");
        if (!accessToken) return [];

        const query = new URLSearchParams({
            from_date: fromDate,
            to_date: toDate,
        }).toString();

        const response = await fetch(
            `${PAYMENT_BY_CUSTOMER}/${customer_id}?${query}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
            }
        );

        const data = await response.json();

        if (response.ok) {
            return data.data;
        } else {
            console.error("Fetch payment failed:", data.message);
            return [];
        }
    } catch (err) {
        console.error("Error fetching payment:", err);
        return [];
    }
};

export const fetchOverviewCustomer = async (
    target_id: string | number,
    period: string // dạng YYYY-MM
): Promise<any> => {
    try {
        const accessToken = Cookies.get("accessToken");
        if (!accessToken) return null;

        const response = await fetch(
            `${OVERVIEW_CUSTOMER}/${target_id}/${period}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
            }
        );

        const result = await response.json();

        if (response.ok) {
            return result; // API trả về overview + customer
        } else {
            console.error("Fetch overview failed:", result.error || result.message);
            return null;
        }
    } catch (err) {
        console.error("Error fetching overview:", err);
        return null;
    }
};
export const fetchOverviewSupplier = async (
    supplierId: string | number,
    period: string   // YYYY-MM
): Promise<any> => {
    try {
        const accessToken = Cookies.get("accessToken");
        if (!accessToken) return null;

        const response = await fetch(
            `${OVERVIEW_SUPPLIER}/${supplierId}/${period}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
            }
        );

        const result = await response.json();

        if (response.ok) {
            return result; // overview + supplier
        } else {
            console.error("Fetch overview supplier failed:", result.error || result.message);
            return null;
        }
    } catch (err) {
        console.error("Error fetching supplier overview:", err);
        return null;
    }
};
export const fetchDashboard = async (
    type: "date" | "week" | "month" | "year",
    value: string, // "2025-02-10" | "2025-02" | "2025"
): Promise<any> => {
    try {
        const token = Cookies.get("accessToken");
        if (!token) return null;

        const response = await fetch(
            `${DASHBOARD}/${type}/${value}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            }
        );

        const result = await response.json();

        if (response.ok) {
            return result;  // trả về object dashboard
        } else {
            console.error("Fetch dashboard failed:", result.message);
            return null;
        }
    } catch (err) {
        console.error("Error fetching dashboard:", err);
        return null;
    }
};
