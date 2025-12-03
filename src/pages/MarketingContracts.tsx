import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Contract, AccountType, Customer, Supplier, BudgetContract } from '../types';
import { formatCurrency, formatDate, exportToCSV, getProductTypeLabel, formatNumber, handleMoneyInput } from '../lib/utils';
import { Download, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../lib/authContext';
import { fetchAccountType, fetchBudgetContract, fetchCustomer, fetchFilteredContracts, fetchSupplier } from '../lib/fetchData';
import Cookies from 'js-cookie';
import { CONTRACT } from '../config/API';
import { DeleteDialog } from '../components/ui/DeleteDialogProps';

export function MarketingContracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [budgets, setBudgets] = useState<BudgetContract[]>([]);
  const today = new Date().toISOString().split("T")[0];
  const access_token = Cookies.get('accessToken');

  const [currentPage, setCurrentPage] = useState(1);
  const [page, setPage] = useState({
    from: 0,
    to: 0,
    total: 0,
    next_page_url: "",
    prev_page_url: "",
    last_page: 0,
  });

  // Filters
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [accountTypeFilter, setAccountTypeFilter] = useState('all');
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');

  // Dialog
  const [contractDialog, setContractDialog] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  // Form
  const [contractForm, setContractForm] = useState<Partial<Contract>>({
    date: today,
    customer_id: '',
    budget_id: '',
    product: '',
    product_type: 'legal',
    total_cost: 0,
    customer_rate: 0,
    supplier_rate: 0,
    note: '',
    customer_actually_paid:0,
  });
  const [calculateMoney, setCalculateMoney] = useState({
    customer_paid: 0,
    supplier_paid: 0,
  });
  const [selectedBudget, setSelectedBudget] = useState<BudgetContract | null>(null);
  useEffect(() => {
    const loadData = async () => {
      try {
        const supplierData = await fetchSupplier();
        const accountTypeData = await fetchAccountType();
        const customerData = await fetchCustomer();
        const budgetData = await fetchBudgetContract();
        setSuppliers(supplierData);
        setAccountTypes(accountTypeData);
        setCustomers(customerData);
        setBudgets(budgetData)
      } catch (error) {
        console.error("Lỗi load data:", error);
      }
    };
    loadData();
  }, []);
  useEffect(() => {
    const loadData = async () => {
      const res = await fetchFilteredContracts({
        customer_id: customerFilter,
        supplier_id: supplierFilter,
        account_type_id: accountTypeFilter,
        product_type: productTypeFilter,
        from_date: dateFrom,
        to_date: dateTo,
        page: currentPage,
        per_page: 10
      });
      const contractData = res.data;
      // console.log("contractData", res);

      setContracts(contractData);
      setPage({
        from: res.pagination.from,
        to: res.pagination.to,
        total: res.pagination.total,
        next_page_url: res.pagination.next_page_url || null,
        prev_page_url: res.pagination.prev_page_url || null,
        last_page: res.pagination.last_page,
      });
    }
    loadData();
  }, [customerFilter, supplierFilter, accountTypeFilter, productTypeFilter, dateFrom, dateTo, currentPage])
  // Check if budget exceeded
  const isBudgetExceeded = useMemo(() => {
    if (!contractForm.budget_id || !contractForm.total_cost || !selectedBudget)
      return false;

    const usage = Number(selectedBudget.used_budget) || 0;
    const budgetMoney = Number(selectedBudget.budget_money) || 0;
    const totalCost = Number(contractForm.total_cost) || 0;

    const newUsed = usage + totalCost;
    return newUsed > budgetMoney;
  }, [
    contractForm.budget_id,
    contractForm.total_cost,
    editingContract,
    contracts,
  ]);


  // Calculate totals
  const totals = useMemo(() => {
    return {
      totalBudgetMoney: contracts.reduce((sum, c) => sum + +  c.total_cost, 0),
      totalCustomerPaid: contracts.reduce((sum, c) => sum + +c.total_cost * c.customer_rate, 0),
      totalSupplierPaid: contracts.reduce((sum, c) => sum + + c.total_cost * c.supplier_rate, 0),
      totalProfit: contracts.reduce((sum, c) => sum + + c.total_cost * (c.customer_rate - c.supplier_rate), 0),
    };
  }, [contracts]);


  // Handle budget selection
  const handleBudgetSelect = (budgetId: string) => {
    const budget = budgets.find((b) => b.id === budgetId);
    if (budget) {
      setSelectedBudget(budget);

      // Auto fill rates from budget
      const newCustomerRate = contractForm.customer_rate || budget.customer_rate;
      const newSupplierRate = contractForm.supplier_rate || budget.supplier_rate;

      setContractForm({
        ...contractForm,
        budget_id: budgetId,
        customer_rate: newCustomerRate,
        supplier_rate: newSupplierRate,
      });
    }
  };

  // Calculate amounts when budget_money or rates change
  const handleBudgetMoneyChange = (value: number) => {
    const customerRate = contractForm.customer_rate || 0;
    const supplierRate = contractForm.supplier_rate || 0;
    setContractForm({
      ...contractForm,
      total_cost: value,
    });
    setCalculateMoney({
      ...calculateMoney,
      customer_paid: value * customerRate,
      supplier_paid: value * supplierRate,
    });
  };

  const handleCustomerRateChange = (value: number) => {
    const total_cost = contractForm.total_cost || 0;

    setContractForm({
      ...contractForm,
      customer_rate: value,
    });
    setCalculateMoney({
      ...calculateMoney,
      customer_paid: value * total_cost,
    });
  };

  const handleSupplierRateChange = (value: number) => {
    const total_cost = contractForm.total_cost || 0;

    setContractForm({
      ...contractForm,
      supplier_rate: value,
    });
    setCalculateMoney({
      ...calculateMoney,
      supplier_paid: value * total_cost,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!access_token) {
      toast.info('Phiên đăng nhập hết hạn vui lòng đăng nhập lại');
    }
    if (editingContract) {
      try {
        const response = await fetch(`${CONTRACT}/${editingContract.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${access_token}`
          },
          body: JSON.stringify(contractForm),
        });
        const data = await response.json();
        // console.log("data", data);
        if (response.ok) {
          setContracts(
            contracts.map((c) =>
              c.id === editingContract.id
                ? { ...c, ...data.data }
                : c
            )
          );
          toast.success('Cập nhật hợp đồng thành công!');
        } else {
          toast.error(`Cập nhật hợp đồng thất bại: ${data.message}`);
        }
      } catch (error) {
        console.log("Đã có lỗi trong quá trình cập nhật hợp đồng", error);
        toast.error('Đã có lỗi trong quá trình cập nhật hợp đồng');
      }
    } else {
      try {
        const response = await fetch(CONTRACT, {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${access_token}`
          },
          body: JSON.stringify(contractForm),
        });
        const data = await response.json();
        // console.log('data contracts: ', data);

        if (response.ok) {
          setContracts([...contracts, data.data]);
          toast.success('Thêm hợp đồng thành công!');
        } else {
          toast.error(`Thêm hợp đồng thất bại: ${data.message}`);
        }
      } catch (error) {
        console.log("Đã có lỗi trong quá trình cập nhật hợp đồng", error);
        toast.error('Đã có lỗi trong quá trình cập nhật hợp đồng');
      }
    }
    resetForm();
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setContractForm(contract);
    const budget = budgets.find((b) => b.id === contract.budget_id);
    if (budget) {
      setSelectedBudget(budget);
      setCalculateMoney({
        customer_paid: contract.total_cost *contract.customer_rate,
        supplier_paid: contract.total_cost * contract.supplier_rate,
      })
    }
    setContractDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${CONTRACT}/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setContracts(contracts.filter((b) => b.id !== id));
        toast.success("Xóa hợp đồng thành công!");
      } else {
        toast.error(`Xóa hợp đồng thất bại: ${data.message}`);
      }
    } catch (error) {
      console.error("Đã có lỗi trong quá trình xóa hợp đồng", error);
      toast.error("Đã có lỗi trong quá trình xóa hợp đồng");
    }
  };

  const resetForm = () => {
    setContractDialog(false);
    setEditingContract(null);
    setSelectedBudget(null);
    setContractForm({
      date: today,
      customer_id: '',
      budget_id: '',
      product: '',
      product_type: 'legal',
      total_cost: 0,
      customer_rate: 0,
      supplier_rate: 0,
      note: '',
      customer_actually_paid: 0,
    });
  };

  const handleExport = () => {
    const exportData = contracts
      .map((contract) => {
        const supplier_cost = contract.total_cost * contract.supplier_rate;
        const customer_cost = contract.total_cost * contract.customer_rate;
        const profit = customer_cost - supplier_cost;
        const budget = budgets.find((b) => b.id === contract.budget_id);

        if (!budget) return null;

        return {
          Ngày: formatDate(contract.date),
          'Khách hàng': contract.customer_name,
          'Nguồn': `${budget.supplier_name} - ${budget.account_type_name} - ${formatCurrency(budget.budget_money)}`,
          'Loại TK': contract.account_type_name,
          'Sản phẩm': contract.product,
          'Loại SP': getProductTypeLabel(contract.product_type),
          'Tiền chạy': contract.total_cost,
          'Rate khách': contract.customer_rate,
          'Rate nguồn': contract.supplier_rate,
          'Tiền khách': formatCurrency(customer_cost),
          'Tiền nguồn': formatCurrency(supplier_cost),
          'Lợi nhuận': formatCurrency(profit),
          'Ghi chú': contract.note,
        };
      })
      .filter((item) => item !== null);

    exportToCSV(exportData, 'marketing_contracts');
    toast.success('Xuất dữ liệu thành công!');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl">Quản lý hợp đồng</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Xuất Excel
            </Button>
            <Button onClick={() => setContractDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm hợp đồng
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Tổng tiền chạy</p>
            <p className="text-2xl text-blue-600">{formatCurrency(totals.totalBudgetMoney)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Tổng tiền khách</p>
            <p className="text-2xl text-green-600">{formatCurrency(totals.totalCustomerPaid)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Tổng tiền nguồn</p>
            <p className="text-2xl text-orange-600">{formatCurrency(totals.totalSupplierPaid)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Tổng lợi nhuận</p>
            <p className={`text-2xl ${totals.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totals.totalProfit)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label>Từ ngày</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label>Đến ngày</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div>
              <Label>Khách hàng</Label>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nguồn</Label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Loại tài khoản</Label>
              <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Loại sản phẩm</Label>
              <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="legal">Không vi phạm</SelectItem>
                  <SelectItem value="illegal">Vi phạm</SelectItem>
                  <SelectItem value="middle-illegal">Vi phạm nhẹ</SelectItem>

                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm min-w-[100px]">Ngày</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[150px]">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[120px]">Nguồn</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[120px]">Loại TK</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[180px]">Sản phẩm</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[100px]">Loại SP</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[120px]">Tiền chạy</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[100px]">Rate khách</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[100px]">Rate nguồn</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[120px]">Tiền khách</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[120px]">Tiền nguồn</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[120px]">Lợi nhuận</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[150px]">Ghi chú</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[100px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => {
                  const supplier_cost = contract.total_cost * contract.supplier_rate;
                  const customer_cost = contract.total_cost * contract.customer_rate;
                  const profit = customer_cost - supplier_cost;
                  return (
                    <tr key={contract.id} className="border-t">
                      <td className="px-4 py-3 text-sm">{formatDate(contract.date)}</td>
                      <td className="px-4 py-3 text-sm">{contract.customer_name}</td>
                      <td className="px-4 py-3 text-sm">{contract.supplier_name}</td>
                      <td className="px-4 py-3 text-sm">{contract.account_type_name}</td>
                      <td className="px-4 py-3 text-sm">{contract.product}</td>
                      <td className="px-4 py-3 text-sm">
                        {getProductTypeLabel(contract.product_type)}
                      </td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(contract.total_cost)}</td>
                      <td className="px-4 py-3 text-sm">{(contract.customer_rate * 100).toFixed(0)}%</td>
                      <td className="px-4 py-3 text-sm">{(contract.supplier_rate * 100).toFixed(0)}%</td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(customer_cost)}</td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(supplier_cost)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(profit)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{contract.note}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(contract)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user?.role === 'admin' && (
                            <DeleteDialog
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                // onClick={() => setEditingSupplier(supplier)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              }
                              title="Xóa hợp đồng"
                              description={`Bạn có chắc chắn muốn xóa hợp đồng này không? Hành động này không thể hoàn tác.`}
                              onConfirm={() => handleDelete(contract.id)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-gray-500">
              Hiển thị {page.from} đến {' '}
              {page.to} trong tổng số{' '}
              {page.total} hợp đồng
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={page.prev_page_url === null}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center px-4">
                Trang {currentPage} / {page.last_page || 1}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={page.next_page_url === null}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contract Dialog */}
        <Dialog open={contractDialog} onOpenChange={setContractDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingContract ? 'Sửa hợp đồng' : 'Thêm hợp đồng mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Ngày *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={contractForm.date}
                    onChange={(e) => setContractForm({ ...contractForm, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customer">Khách hàng *</Label>
                  <Select
                    value={String(contractForm.customer_id ?? "")}
                    onValueChange={(value) =>
                      setContractForm({ ...contractForm, customer_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khách hàng" />
                    </SelectTrigger>

                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={String(customer.id)}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                </div>

                <div>
                  <Label htmlFor="product_type">Loại sản phẩm *</Label>
                  <Select
                    value={contractForm.product_type}
                    onValueChange={(value: 'legal' | 'illegal' | 'middle-illegal') =>
                      setContractForm({ ...contractForm, product_type: value, budget_id: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="legal">Không vi phạm</SelectItem>
                      <SelectItem value="illegal">Vi phạm</SelectItem>
                      <SelectItem value="middle-illegal">Vi phạm nhẹ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="budget">Budget *</Label>
                  <Select
                    value={contractForm.budget_id}
                    onValueChange={handleBudgetSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn budget" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgets
                        .map((budget) => {
                          return (
                            <SelectItem key={budget.id} value={budget.id}>
                              {budget.supplier_name} - ${budget.account_type_name} - ${formatCurrency(budget.budget_money)}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedBudget && (
                <div className="p-3 bg-blue-50 rounded text-sm space-y-1">
                  <p><strong>Rate khách:</strong> {(selectedBudget.customer_rate * 100).toFixed(0)}%</p>
                  <p><strong>Rate nguồn:</strong> {(selectedBudget.supplier_rate * 100).toFixed(0)}%</p>
                  {contractForm.budget_id && selectedBudget && (
                    <>
                      {(() => {
                        // Ép kiểu number để tính toán chính xác
                        const usage = Number(selectedBudget.used_budget) || 0;
                        const budgetMoney = Number(selectedBudget.budget_money) || 0;
                        const totalCost = Number(contractForm.total_cost) || 0;
                        const newUsed = usage + totalCost;
                        const exceeded = newUsed > budgetMoney;

                        return (
                          <>
                            <p>
                              <strong>Tổng ngân sách:</strong> {formatCurrency(budgetMoney)}
                            </p>
                            <p>
                              <strong>Đã sử dụng:</strong> {formatCurrency(usage)}
                            </p>
                            <p>
                              <strong>Còn lại:</strong> {formatCurrency(budgetMoney - usage)}
                            </p>

                            {totalCost > 0 && (
                              <p className={exceeded ? 'text-red-600' : 'text-green-600'}>
                                <strong>Sau khi thêm:</strong> {formatCurrency(newUsed)} / {formatCurrency(budgetMoney)}
                                {exceeded && ' ⚠️ VƯỢT NGÂN SÁCH!'}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}

                </div>
              )}

              <div>
                <Label htmlFor="product">Sản phẩm *</Label>
                <Input
                  id="product"
                  value={contractForm.product}
                  onChange={(e) => setContractForm({ ...contractForm, product: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget_money">Tiền chạy *</Label>
                  <Input
                    id="budget_money"
                    type="text"
                    value={formatNumber(contractForm.total_cost ?? 0)}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const number = handleMoneyInput(rawValue);

                      setContractForm({
                        ...contractForm,
                        total_cost: number,
                      });

                      handleBudgetMoneyChange(number); // dùng number đã clean, không dùng Number(e.target.value)
                    }}
                  />

                </div>

                <div>
                  <Label htmlFor="customer_actually_paid">Tiền khách đã thanh toán</Label>
                  <Input
                    id="customer_actually_paid"
                    type="text"
                    value={formatNumber(contractForm.customer_actually_paid??0)}
                    onChange={(e) => {
                      const number = handleMoneyInput(e.target.value);
                      setContractForm({
                        ...contractForm,
                        customer_actually_paid: number
                      });
                    }}
                  />

                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_rate">Rate khách (VD: 0.2 cho 20%)</Label>
                  <Input
                    id="customer_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={contractForm.customer_rate}
                    onChange={(e) => handleCustomerRateChange(Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="supplier_rate">Rate nguồn (VD: 0.15 cho 15%)</Label>
                  <Input
                    id="supplier_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={contractForm.supplier_rate}
                    onChange={(e) => handleSupplierRateChange(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tiền khách (tự động tính)</Label>
                  <Input
                    type="text"
                    value={formatCurrency(calculateMoney.customer_paid)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label>Tiền nguồn (tự động tính)</Label>
                  <Input
                    type="text"
                    value={formatCurrency(calculateMoney.supplier_paid)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea
                  id="note"
                  value={contractForm.note}
                  onChange={(e) => setContractForm({ ...contractForm, note: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isBudgetExceeded}
                >
                  {editingContract ? 'Cập nhật' : 'Thêm'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}