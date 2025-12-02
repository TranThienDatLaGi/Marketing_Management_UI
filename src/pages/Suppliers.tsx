import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Supplier, Budget, AccountType } from '../types';
import { formatCurrency, formatDate, exportToCSV, getProductTypeLabel } from '../lib/utils';
import { Download, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { fetchAccountType, fetchBudgetBySupplier, fetchSupplier } from '../lib/fetchData';
import Cookies from 'js-cookie';
import { BUDGET, SUPPLIER } from '../config/API';
import { DeleteDialog } from '../components/ui/DeleteDialogProps';
export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const today = new Date().toISOString().split("T")[0];
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [page, setPage] = useState({
    from: 0,
    to: 0,
    total: 0,
    next_page_url: "",
    prev_page_url: "",
    last_page: 0,
  });
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
  // Sort
  const [sortBy, setSortBy] = useState<"money" | "supplier_rate" | "customer_rate" | "created_at">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">('desc');

  // Dialogs
  const [supplierDialog, setSupplierDialog] = useState(false);
  const [budgetDialog, setBudgetDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const access_token = Cookies.get('accessToken');
  type BudgetForm = Omit<Partial<Budget>, 'money'> & { money: number };
  // Supplier Forms
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
    name: '',
    zalo: '',
    phoneNumber: '',
    address: '',
    note: '',
  });
  // Budget Forms
  const [budgetForm, setBudgetForm] = useState<BudgetForm>({
    supplier_id: selectedSupplier || '',
    account_type_id: '',
    money: 0,
    product_type: 'legal',
    supplier_rate: 0.15,
    customer_rate: 0.2,
    status: 'active',
    note: '',
    date: today,
  });
  // Fetch Supplier
  useEffect(() => {
    const loadData = async () => {
      try {
        const supplierData = await fetchSupplier();
        const accountTypeData = await fetchAccountType();

        setAccountTypes(accountTypeData);

        if (supplierData.length > 0) {
          setSuppliers(supplierData);
          setSelectedSupplier(supplierData[0].id);

          // Gán supplier_id vào budgetForm
          setBudgetForm((prev) => ({
            ...prev,
            supplier_id: supplierData[0].id
          }));
        }
      } catch (error) {
        console.error("Lỗi load data:", error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (suppliers.length === 0) {
      setSelectedSupplier(null);
      return;
    }
    const exists = suppliers.some((s) => s.id === selectedSupplier);
    if (!exists) {
      setSelectedSupplier(suppliers[0].id);
    }
  }, [suppliers]);

  // Fetch Budget
  useEffect(() => {
    const loadData = async () => {
      if (!selectedSupplier) {
        return; // hoặc return setData([])
      }
      const res = await fetchBudgetBySupplier(selectedSupplier, {
        status: statusFilter,
        product_type: productTypeFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        limit: 5
      });
      // console.log("budget: ", res);
      const budget = res.data;
      setBudgets(budget);
      setPage({
        from: res.meta.from,
        to: res.meta.to,
        total: res.meta.total,
        next_page_url: res.links.next || null,
        prev_page_url: res.links.prev || null,
        last_page: res.meta.last_page,
      });
    }
    loadData();
  }, [selectedSupplier, statusFilter, productTypeFilter, sortBy, sortOrder, currentPage])
  const supplier = suppliers.find((s) => s.id === selectedSupplier);
  const supplierBudgets = budgets.filter((b) => b.supplier_id === selectedSupplier);
  // Supplier handlers
  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!access_token) {
      toast.info('Phiên đăng nhập hết hạn vui lòng đăng nhập lại');
    }
    
    if (editingSupplier) {
      try {
        const response = await fetch(`${SUPPLIER}/${editingSupplier.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${access_token}`
          },
          body: JSON.stringify(supplierForm),
        });
        const data = await response.json();
        if (response.ok) {
          setSuppliers(suppliers.map((s) => (s.id === editingSupplier.id ? { ...s, ...supplierForm } : s)));
          toast.success('Cập nhật nguồn thành công!');
        } else {
          toast.error(`Cập nhật nguồn thất bại: ${data.message}`);
        }
      } catch (error) {
        console.log("Đã có lỗi trong quá trình cập nhật nguồn", error);
        toast.error('Đã có lỗi trong quá trình cập nhật nguồn');
      }
    } else {
      try {
        const response = await fetch(SUPPLIER, {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${access_token}`
          },
          body: JSON.stringify(supplierForm),
        });
        const data = await response.json();
        // console.log('data: ', data);

        if (response.ok) {
          setSuppliers([...suppliers, data]);
          setSelectedSupplier(data.id);
          toast.success('Thêm nguồn thành công!');
        } else {
          toast.error(`Thêm nguồn thất bại: ${data.message}`);
        }
      } catch (error) {
        console.log("Đã có lỗi trong quá trình cập nhật nguồn", error);
        toast.error('Đã có lỗi trong quá trình cập nhật nguồn');
      }
    }
    resetSupplierForm();
  };
  const handleEditSupplier = () => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierForm(supplier);
      setSupplierDialog(true);
    }
  };
  const handleDeleteSupplier = async () => {
    try {
      const response = await fetch(`${SUPPLIER}/${selectedSupplier}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Xóa nguồn thành công!");

      } else {
        toast.error(`Xóa nguồn thất bại: ${data.message}`);
      }
    } catch (error) {
      console.error("Đã có lỗi trong quá trình xóa nguồn", error);
      toast.error("Đã có lỗi trong quá trình xóa nguồn");
    }
  };
  const resetSupplierForm = () => {
    setSupplierDialog(false);
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      zalo: '',
      phoneNumber: '',
      address: '',
      note: '',
    });
  };
  //-----------------------Budget-----------------------------------
  // Budget handlers
  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!access_token) {
      toast.info('Phiên đăng nhập hết hạn vui lòng đăng nhập lại');
    }
    const payload = {
      supplier_id: selectedSupplier,
      account_type_id: budgetForm.account_type_id,
      money: budgetForm.money,
      product_type: budgetForm.product_type,
      supplier_rate: budgetForm.supplier_rate,
      customer_rate: budgetForm.customer_rate,
      status: budgetForm.status,
      note: budgetForm.note,
      date: budgetForm.date,
    }
    // console.log("payload", payload);
    
    if (editingBudget) {
      try {
        const response = await fetch(`${BUDGET}/${editingBudget.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${access_token}`
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        // console.log("data", data);
        if (response.ok) {
          setBudgets(budgets.map((b) => (b.id === editingBudget.id ? { ...b, ...data.data } : b)));
          toast.success('Cập nhật ngân sách thành công!');
        } else {
          toast.error(`Cập nhật ngân sách thất bại: ${data.message}`);
        }
      } catch (error) {
        console.log("Đã có lỗi trong quá trình cập nhật ngân sách", error);
        toast.error('Đã có lỗi trong quá trình cập nhật ngân sách');
      }
    } else {
      try {
        const response = await fetch(BUDGET, {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${access_token}`
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        // console.log('data BUDGET: ', data);

        if (response.ok) {
          setBudgets([...budgets, data.data]);
          toast.success('Thêm ngân sách thành công!');
        } else {
          toast.error(`Thêm ngân sách thất bại: ${data.message}`);
        }
      } catch (error) {
        console.log("Đã có lỗi trong quá trình cập nhật ngân sách", error);
        toast.error('Đã có lỗi trong quá trình cập nhật ngân sách');
      }
    }
    resetBudgetForm();
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    // console.log("budget", budget);
    
    setBudgetForm(budget);
    setBudgetDialog(true);
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      const response = await fetch(`${BUDGET}/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setBudgets(budgets.filter((b) => b.id !== id));
        toast.success("Xóa ngân sách thành công!");
      } else {
        toast.error(`Xóa ngân sách thất bại: ${data.message}`);
      }
    } catch (error) {
      console.error("Đã có lỗi trong quá trình xóa ngân sách", error);
      toast.error("Đã có lỗi trong quá trình xóa ngân sách");
    }
  };

  const resetBudgetForm = () => {
    setBudgetDialog(false);
    setEditingBudget(null);
    setBudgetForm({
      supplier_id: selectedSupplier || '',
      account_type_id: '',
      money: 0,
      product_type: 'legal',
      supplier_rate: 0.15,
      customer_rate: 0.2,
      status: 'active',
      note: '',
      date: today,
    });
  };
  // Export
  const handleExport = () => {
    if (!supplier) return;
    const exportData = supplierBudgets.map((budget) => {
      const accountType = accountTypes.find((at) => at.id === budget.account_type_id);
      return {
        Nguồn: supplier.name,
        Ngày: formatDate(budget.date),
        'Loại TK': accountType?.name || '',
        'Số tiền': budget.money,
        'Loại SP': budget.product_type === 'legal' ? 'Sạch' : 'Không sạch',
        'Rate nguồn': budget.supplier_rate,
        'Rate khách': budget.customer_rate,
        'Trạng thái': budget.status === 'active' ? 'Hoạt động' : 'Không hoạt động',
        'Ghi chú': budget.note,
      };
    });

    exportToCSV(exportData, `supplier_${supplier.name}`);
    toast.success('Xuất dữ liệu thành công!');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl">Quản lý nguồn</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Xuất Excel
            </Button>
            <Button onClick={() => setSupplierDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm nguồn
            </Button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm mb-2">Chọn nguồn</label>
              <Select
                value={selectedSupplier ?? undefined}
                onValueChange={(v: string) => setSelectedSupplier(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {supplier && (
              <div className="flex gap-2 mt-6">
                <Button variant="outline" size="sm" onClick={handleEditSupplier}>
                  <Edit className="mr-2 h-4 w-4" />
                  Sửa nguồn
                </Button>
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
                  title="Xóa nguồn"
                  description={`Bạn có chắc chắn muốn xóa nguồn "${supplier?.name}" không? Hành động này không thể hoàn tác.`}
                  onConfirm={() => handleDeleteSupplier()}
                />
              </div>
            )}
          </div>
          {/* supplier detail */}
          {supplier && (
            <>
              <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded">
                <div>
                  <p className="text-sm text-gray-500">Tên nguồn</p>
                  <p>{supplier.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Zalo</p>
                  <p>{supplier.zalo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p>{supplier.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Địa chỉ</p>
                  <p>{supplier.address}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Ghi chú</p>
                  <p>{supplier.note}</p>
                </div>
              </div>
              {/* ----------------------------------------------Budget------------------------------------------------ */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl">Danh sách Budget</h2>
                <Button onClick={() => setBudgetDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm budget
                </Button>
              </div>

              {/* Filter Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded">
                <div className="flex items-center justify-between gap-2 min-w-[250px]">
                  <Label className="whitespace-nowrap">Lọc theo trạng thái</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">Tất cả</SelectItem>
                      <SelectItem value="active">Hoạt động</SelectItem>
                      <SelectItem value="inactive">Không hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between gap-2 min-w-[250px]">
                  <Label className="whitespace-nowrap">Lọc theo loại sản phẩm</Label>
                  <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">Tất cả</SelectItem>
                      <SelectItem value="legal">Không vi phạm</SelectItem>
                      <SelectItem value="illegal">Vi phạm</SelectItem>
                      <SelectItem value="middle-illegal">Vi phạm nhẹ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-2 min-w-[250px]">
                  <Label className="whitespace-nowrap">Sắp xếp theo</Label>
                  <Select value={sortBy}
                    onValueChange={(value: "money" | "supplier_rate" | "customer_rate" | "created_at") => setSortBy(value)} >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Ngày tạo</SelectItem>
                      <SelectItem value="money">Số tiền</SelectItem>
                      <SelectItem value="supplier_rate">Rate nguồn</SelectItem>
                      <SelectItem value="customer_rate">Rate khách</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-2 min-w-[250px]">
                  <Label className="whitespace-nowrap">Chiều</Label>
                  <Select
                    value={sortOrder}
                    onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Sắp xếp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Giảm dần</SelectItem>
                      <SelectItem value="asc">Tăng dần</SelectItem>
                    </SelectContent>
                  </Select>

                </div>

              </div>

              {/*---------------------------budget---------------------------------- */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm min-w-[100px]">Ngày</th>
                      <th className="px-4 py-3 text-left text-sm min-w-[120px]">Loại TK</th>
                      <th className="px-4 py-3 text-left text-sm min-w-[120px]">Số tiền</th>
                      <th className="px-4 py-3 text-left text-sm min-w-[100px]">Loại SP</th>
                      <th className="px-4 py-3 text-left text-sm min-w-[100px]">Rate nguồn</th>
                      <th className="px-4 py-3 text-left text-sm min-w-[100px]">Rate khách</th>
                      <th className="px-4 py-3 text-left text-sm min-w-[100px]">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-sm min-w-[150px]">Ghi chú</th>
                      <th className="px-4 py-3 text-left text-sm min-w-[100px]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.map((budget) => {
                      return (
                        <tr key={budget.id} className="border-t">
                          <td className="px-4 py-3 text-sm">{formatDate(budget.date)}</td>
                          <td className="px-4 py-3 text-sm">{budget.account_type_name}</td>
                          <td className="px-4 py-3 text-sm">{formatCurrency(budget.money)}</td>
                          <td className="px-4 py-3 text-sm">
                            {getProductTypeLabel(budget.product_type)}
                          </td>
                          <td className="px-4 py-3 text-sm">{(budget.supplier_rate * 100).toFixed(0)}%</td>
                          <td className="px-4 py-3 text-sm">{(budget.customer_rate * 100).toFixed(0)}%</td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded text-xs ${budget.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                              {budget.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{budget.note}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditBudget(budget)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <DeleteDialog
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                  // onClick={() => setDeleteCustomerId(customer.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                }
                                title="Xóa ngân sách"
                                description={`Bạn có chắc chắn muốn xóa ngân sách ngày không? Hành động này không thể hoàn tác.`}
                                onConfirm={() => handleDeleteBudget(budget.id)}
                              />
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
                  {page.total} ngân sách
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
            </>
          )}
        </div>

        {/* Supplier Dialog */}
        <Dialog open={supplierDialog} onOpenChange={setSupplierDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSupplier ? 'Sửa nguồn' : 'Thêm nguồn mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSupplierSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Tên nguồn *</Label>
                <Input
                  id="name"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="zalo">Zalo</Label>
                <Input
                  id="zalo"
                  value={supplierForm.zalo}
                  onChange={(e) => setSupplierForm({ ...supplierForm, zalo: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber">Số điện thoại</Label>
                <Input
                  id="phoneNumber"
                  value={supplierForm.phoneNumber}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phoneNumber: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea
                  id="note"
                  value={supplierForm.note}
                  onChange={(e) => setSupplierForm({ ...supplierForm, note: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetSupplierForm}>
                  Hủy
                </Button>
                <Button type="submit">{editingSupplier ? 'Cập nhật' : 'Thêm'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Budget Dialog */}
        <Dialog open={budgetDialog} onOpenChange={setBudgetDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBudget ? 'Sửa budget' : 'Thêm budget mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBudgetSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Ngày *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={budgetForm.date}
                    onChange={(e) => setBudgetForm({ ...budgetForm, date: e.target.value })}
                    // disabled
                  />
                </div>

                <div>
                  <Label htmlFor="account_type">Loại tài khoản *</Label>
                  <Select
                    value={String(budgetForm.account_type_id ?? "")}
                    onValueChange={(value) =>
                      setBudgetForm({ ...budgetForm, account_type_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại tài khoản" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountTypes.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="money">Số tiền *</Label>
                  <Input
                    id="money"
                    type="text"
                    value={(budgetForm.money ?? 0) === 0 ? "" : (budgetForm.money ?? 0).toLocaleString("vi-VN")}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      const number = raw === "" ? 0 : Number(raw);

                      setBudgetForm({
                        ...budgetForm,
                        money: number
                      });
                    }}
                    placeholder="Nhập số tiền..."
                  />
                </div>
                <div>
                  <Label htmlFor="product_type">Loại sản phẩm *</Label>
                  <Select
                    value={budgetForm.product_type}
                    onValueChange={(value: 'legal' | 'illegal' | "middle-illegal") =>
                      setBudgetForm({ ...budgetForm, product_type: value })
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier_rate">Rate nguồn (VD: 0.15 cho 15%)</Label>
                  <Input
                    id="supplier_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={budgetForm.supplier_rate}
                    onChange={(e) =>
                      setBudgetForm({ ...budgetForm, supplier_rate: Number(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="customer_rate">Rate khách (VD: 0.2 cho 20%)</Label>
                  <Input
                    id="customer_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={budgetForm.customer_rate}
                    onChange={(e) =>
                      setBudgetForm({ ...budgetForm, customer_rate: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={budgetForm.status}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setBudgetForm({ ...budgetForm, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="budget_note">Ghi chú</Label>
                <Textarea
                  id="budget_note"
                  value={budgetForm.note}
                  onChange={(e) => setBudgetForm({ ...budgetForm, note: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetBudgetForm}>
                  Hủy
                </Button>
                <Button type="submit">{editingBudget ? 'Cập nhật' : 'Thêm'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}