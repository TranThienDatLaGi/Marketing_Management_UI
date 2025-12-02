import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Bill, Customer, Payment } from '../types';
import { formatCurrency, formatDate, exportToCSV, formatNumber, handleMoneyInput } from '../lib/utils';
import { Download, Edit, Trash2, ChevronLeft, ChevronRight, Eye, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../lib/authContext';
import { fetchCustomer, fetchFilteredBills, fetchPaymentByBill } from '../lib/fetchData';
import Cookies from 'js-cookie';
import { BILL, PAYMENT } from '../config/API';
import { DeleteDialog } from '../components/ui/DeleteDialogProps';

export function Bills() {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  // Dialog
  const [billDialog, setBillDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [viewPaymentsDialog, setViewPaymentsDialog] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedBillForPayments, setSelectedBillForPayments] = useState<Bill | null>(null);

  // Form
  const [billForm, setBillForm] = useState<Partial<Bill>>({
    date: today,
    customer_id: '',
    customer_name: '',
    product: '',
    total_money: 0,
    paid_amount: 0,
    debt_amount: 0,
    deposit_amount: 0,
    status: 'debt',
    note: '',
  });

  const [paymentForm, setPaymentForm] = useState<Partial<Payment>>({
    date: today,
    bill_id: '',
    amount: 0,
    note: '',
  });
  // Current money input for calculation
  const [currentMoney, setCurrentMoney] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const res = await fetchFilteredBills({
        customer_id: customerFilter,
        status: statusFilter,
        from_date: dateFrom,
        to_date: dateTo,
        page: currentPage,
        per_page: 10
      });
      const billsData = res.data;
      // console.log("billsData", res);
      setBills(billsData);
      const customerData = await fetchCustomer();
      setCustomers(customerData)
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
  }, [customerFilter, statusFilter, dateFrom, dateTo, currentPage,payments])
  // Calculate totals
  const totals = useMemo(() => {
    return {
      totalMoney: bills.reduce((sum, b) => sum + +b.total_money, 0),
      totalPaid: bills.reduce((sum, b) => sum + +b.paid_amount, 0),
      totalDeposit: bills.reduce((sum, b) => sum + +b.deposit_amount, 0),
      totalDebt: bills.reduce((sum, b) => sum + +b.debt_amount, 0),
    };
  }, [bills]);


  // Calculate difference
  const calculationDifference = totals.totalDebt + currentMoney - totals.totalDeposit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!access_token) {
      toast.info('Phiên đăng nhập hết hạn vui lòng đăng nhập lại');
    }
    if (editingBill) {
      try {
        const response = await fetch(`${BILL}/${editingBill.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${access_token}`
          },
          body: JSON.stringify(billForm),
        });
        const data = await response.json();
        // console.log("data", data);
        if (response.ok) {
          setBills(bills.map((b) => (b.id === editingBill.id ? { ...b, ...data.data } : b)));
          toast.success('Cập nhật hóa đơn thành công!');
        } else {
          toast.error(`Cập nhật hóa đơn thất bại: ${data.message}`);
        }
      } catch (error) {
        console.log("Đã có lỗi trong quá trình cập nhật hóa đơn", error);
        toast.error('Đã có lỗi trong quá trình cập nhật hóa đơn');
      }
    }
    resetForm();
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setBillForm(bill);
    setBillDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${BILL}/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setBills(bills.filter((b) => b.id !== id));
        toast.success("Xóa hóa đơn thành công!");
      } else {
        toast.error(`Xóa hóa đơn thất bại: ${data.message}`);
      }
    } catch (error) {
      console.error("Đã có lỗi trong quá trình xóa hóa đơn", error);
      toast.error("Đã có lỗi trong quá trình xóa hóa đơn");
    }
  };

  const resetForm = () => {
    setBillDialog(false);
    setEditingBill(null);
    setBillForm({
      date: today,
      customer_id: '',
      customer_name: '',
      product: '',
      total_money: 0,
      paid_amount: 0,
      debt_amount: 0,
      deposit_amount: 0,
      status: 'debt',
      note: '',
    });
  };

  const handleExport = () => {
    const exportData = bills.map((bill) => {
      return {
        Ngày: formatDate(bill.date),
        'Khách hàng': bill.customer_name,
        'Sản phẩm': bill.product,
        'Tổng tiền': bill.total_money,
        'Đã trả': bill.paid_amount,
        'Còn nợ': bill.debt_amount,
        'Tiền cọc': bill.deposit_amount,
        'Trạng thái':
          bill.status === 'completed' ? 'Hoàn thành' : bill.status === 'deposit' ? 'Đặt cọc' : 'Còn nợ',
        'Ghi chú': bill.note,
      };
    });

    exportToCSV(exportData, 'bills');
    toast.success('Xuất dữ liệu thành công!');
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'deposit':
        return 'Đặt cọc';
      case 'debt':
        return 'Còn nợ';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'deposit':
        return 'bg-blue-100 text-blue-700';
      case 'debt':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!access_token) {
      toast.info('Phiên đăng nhập hết hạn vui lòng đăng nhập lại');
    }
    if (editingPayment) {
      try {
        const response = await fetch(`${PAYMENT}/${editingPayment.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${access_token}`
          },
          body: JSON.stringify(paymentForm),
        });
        const data = await response.json();
        // console.log("data", data);
        if (response.ok) {
          setPayments(payments.map((p) => (p.id === editingPayment.id ? { ...p, ...data.data } : p)));
          toast.success('Cập nhật thanh toán thành công!');
        } else {
          toast.error(`Cập nhật thanh toán thất bại: ${data.message}`);
        }
      } catch (error) {
        console.log("Đã có lỗi trong quá trình cập nhật thanh toán", error);
        toast.error('Đã có lỗi trong quá trình cập nhật thanh toán');
      }

    } else {
      try {
        const response = await fetch(PAYMENT, {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${access_token}`
          },
          body: JSON.stringify(paymentForm),
        });
        const data = await response.json();
        // console.log('data BUDGET: ', data);

        if (response.ok) {
          setPayments([...payments, data.data]);
          toast.success('Thêm thanh toán thành công!');
        } else {
          toast.error(`Thêm thanh toán thất bại: ${data.message}`);
        }
      } catch (error) {
        console.log("Đã có lỗi trong quá trình cập nhật thanh toán", error);
        toast.error('Đã có lỗi trong quá trình cập nhật thanh toán');
      }
    }
    resetPaymentForm();
  };

  const handlePaymentEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setPaymentForm(payment);
    setPaymentDialog(true);
  };

  const handlePaymentDelete = async (id: string) => {
    try {
      const response = await fetch(`${PAYMENT}/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setPayments(payments.filter((p) => p.id !== id));
        toast.success('Xóa thanh toán thành công!');
      } else {
        toast.error(`Xóa thanh toán thất bại: ${data.message}`);
      }
    } catch (error) {
      console.error("Đã có lỗi trong quá trình xóa thanh toán", error);
      toast.error("Đã có lỗi trong quá trình xóa thanh toán");
    }
  };

  const resetPaymentForm = () => {
    setPaymentDialog(false);
    setEditingPayment(null);
    setPaymentForm({
      date: today,
      bill_id: '',
      amount: 0,
      note: '',
    });
  };
  const handleViewPayments = async (bill: Bill) => {
    setSelectedBillForPayments(bill);
    const paymentData = await fetchPaymentByBill(bill.id);
    // console.log("paymentData", paymentData);
    setPayments(paymentData);
    setViewPaymentsDialog(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl">Quản lý hóa đơn</h1>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Xuất Excel
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Tổng tiền</p>
            <p className="text-2xl text-gray-700">{formatCurrency(totals.totalMoney)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Tổng đã trả</p>
            <p className="text-2xl text-green-600">{formatCurrency(totals.totalPaid)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Tổng tiền cọc</p>
            <p className="text-2xl text-blue-600">{formatCurrency(totals.totalDeposit)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Tổng tiền nợ</p>
            <p className="text-2xl text-red-600">{formatCurrency(totals.totalDebt)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Tiền hiện tại</p>
            {/* <Input
              type="number"
              value={currentMoney}
              onChange={(e) => setCurrentMoney(Number(e.target.value))}
              className="mt-2"
              placeholder="Nhập số tiền hiện tại"
            /> */}
            <Input
              type="text"
              value={formatNumber(currentMoney)}
              onChange={(e) => {
                const number = handleMoneyInput(e.target.value);
                setCurrentMoney(number);
              }}
              className="mt-2"
              placeholder="Nhập số tiền hiện tại"
            />
          </div>
        </div>

        {/* Calculation Warning */}
        {calculationDifference !== 0 && (
          <div
            className={
              calculationDifference > 0
                ? "bg-red-50 border border-red-200 p-4 rounded-lg"     // thiếu → đỏ
                : "bg-blue-50 border border-blue-200 p-4 rounded-lg"   // thừa → xanh dương
            }
          >
            <p
              className={
                calculationDifference > 0
                  ? "text-red-700"
                  : "text-blue-700"
              }
            >
              ⚠️ Số tiền sau tính toán là{" "}
              <strong>
                {formatCurrency(Math.abs(calculationDifference))}
              </strong>
              {calculationDifference > 0 ? " (thiếu)" : " (thừa)"}.
              Bạn đã sai sót trong quá trình tính toán!
            </p>

            <p
              className={
                calculationDifference > 0
                  ? "text-sm text-red-600 mt-1"
                  : "text-sm text-blue-600 mt-1"
              }
            >
              Công thức: Tiền nợ ({formatCurrency(totals.totalDebt)}) + Tiền hiện tại (
              {formatCurrency(currentMoney)}) - Tiền cọc (
              {formatCurrency(totals.totalDeposit)}) ={" "}
              {formatCurrency(calculationDifference)}
            </p>
          </div>
        )}



        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Từ ngày</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label>Đến ngày</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div>
              <Label>Trạng thái</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="deposit">Đặt cọc</SelectItem>
                  <SelectItem value="debt">Còn nợ</SelectItem>
                </SelectContent>
              </Select>
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
                  <th className="px-4 py-3 text-left text-sm min-w-[180px]">Sản phẩm</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[120px]">Tổng tiền</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[120px]">Đã trả</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[120px]">Còn nợ</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[120px]">Tiền cọc</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[100px]">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[150px]">Ghi chú</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[100px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => {
                  return (
                    <tr key={bill.id} className="border-t">
                      <td className="px-4 py-3 text-sm">{formatDate(bill.date)}</td>
                      <td className="px-4 py-3 text-sm">{bill.customer_name}</td>
                      <td className="px-4 py-3 text-sm">{bill.product}</td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(bill.total_money)}</td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(bill.paid_amount)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={bill.debt_amount > 0 ? 'text-red-600' : ''}>
                          {formatCurrency(bill.debt_amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(bill.deposit_amount)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(bill.status)}`}>
                          {getStatusText(bill.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{bill.note}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(bill)}>
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
                              title="Xóa hóa đơn"
                              description={`Bạn có chắc chắn muốn xóa hóa đơn này không? Hành động này không thể hoàn tác.`}
                              onConfirm={() => handleDelete(bill.id)}
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewPayments(bill)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
              {page.total} hóa đơn
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

        {/* Bill Dialog */}
        <Dialog open={billDialog} onOpenChange={setBillDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sửa hóa đơn</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Ngày *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={billForm.date}
                    onChange={(e) => setBillForm({ ...billForm, date: e.target.value })}
                    required
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="customer">Khách hàng *</Label>
                  <Select
                    value={billForm.customer_id}
                    onValueChange={(value) => setBillForm({ ...billForm, customer_id: value })}
                    disabled
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khách hàng" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="product">Sản phẩm *</Label>
                <Input
                  id="product"
                  value={billForm.product}
                  onChange={(e) => setBillForm({ ...billForm, product: e.target.value })}
                  required
                  disabled
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_money">Tổng tiền *</Label>
                  <Input
                    id="total_money"
                    type="number"
                    value={billForm.total_money}
                    onChange={(e) => setBillForm({ ...billForm, total_money: Number(e.target.value) })}
                    required
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="deposit">Tiền cọc</Label>
                  {/* <Input
                    id="deposit"
                    type="number"
                    value={billForm.deposit_amount}
                    onChange={(e) => setBillForm({ ...billForm, deposit_amount: Number(e.target.value) })}
                  /> */}
                  <Input
                    type="text"
                    value={formatNumber(billForm.deposit_amount || 0)}
                    onChange={(e) => {
                      const number = handleMoneyInput(e.target.value);
                      setBillForm({ ...billForm, deposit_amount: number })
                    }}
                    className="mt-2"
                    placeholder="Nhập số tiền hiện tại"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_paid">Đã trả</Label>
                  <Input
                    id="total_paid"
                    type="number"
                    value={billForm.paid_amount}
                    onChange={(e) => setBillForm({ ...billForm, paid_amount: Number(e.target.value) })}
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="total_debt">Còn nợ</Label>
                  <Input
                    id="total_debt"
                    type="number"
                    value={billForm.debt_amount}
                    onChange={(e) => setBillForm({ ...billForm, debt_amount: Number(e.target.value) })}
                    disabled
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={billForm.status}
                  onValueChange={(value: 'deposit' | 'debt' | 'completed') =>
                    setBillForm({ ...billForm, status: value })
                  }
                  disabled
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="done">Hoàn thành</SelectItem>
                    <SelectItem value="deposit">Đặt cọc</SelectItem>
                    <SelectItem value="debt">Còn nợ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea
                  id="note"
                  value={billForm.note}
                  onChange={(e) => setBillForm({ ...billForm, note: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Hủy
                </Button>
                <Button type="submit">Cập nhật</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPayment ? 'Sửa thanh toán' : 'Thêm thanh toán mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Ngày *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="bill">Hóa đơn *</Label>
                  <Select
                    value={paymentForm.bill_id}
                    onValueChange={(value) => setPaymentForm({ ...paymentForm, bill_id: value })}
                    disabled
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn hóa đơn" />
                    </SelectTrigger>
                    <SelectContent>
                      {bills.map((bill) => (
                        <SelectItem key={bill.id} value={bill.id}>
                          {bill.product} - {formatDate(bill.date)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="amount">Số tiền *</Label>
                <Input
                  id="amount"
                  type="text"
                  value={formatNumber(paymentForm.amount || 0)}
                  onChange={(e) => {
                    const number = handleMoneyInput(e.target.value);
                    setPaymentForm({ ...paymentForm, amount: number });
                  }}
                />
              </div>

              <div>
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea
                  id="note"
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetPaymentForm}>
                  Hủy
                </Button>
                <Button type="submit">{editingPayment ? 'Cập nhật' : 'Thêm'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Payments Dialog */}
        <Dialog open={viewPaymentsDialog} onOpenChange={setViewPaymentsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Danh sách thanh toán</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedBillForPayments && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm text-gray-500">Ngày hóa đơn</p>
                    <p>{formatDate(selectedBillForPayments.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Khách hàng</p>
                    <p>
                      {selectedBillForPayments.customer_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sản phẩm</p>
                    <p>{selectedBillForPayments.product}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tổng tiền</p>
                    <p className="text-gray-700">{formatCurrency(selectedBillForPayments.total_money)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Đã trả</p>
                    <p className="text-green-600">{formatCurrency(selectedBillForPayments.paid_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Còn nợ</p>
                    <p className="text-red-600">{formatCurrency(selectedBillForPayments.debt_amount)}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <h3 className="text-lg">Lịch sử thanh toán</h3>
                <Button
                  onClick={() => {
                    setPaymentForm({
                      ...paymentForm,
                      bill_id: selectedBillForPayments?.id || '',
                    });
                    setPaymentDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm thanh toán
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm">Ngày</th>
                      <th className="px-4 py-3 text-left text-sm">Số tiền</th>
                      <th className="px-4 py-3 text-left text-sm">Ghi chú</th>
                      {user?.role === 'admin' && (
                        <th className="px-4 py-3 text-left text-sm">Thao tác</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-t">
                        <td className="px-4 py-3 text-sm">{formatDate(payment.date)}</td>
                        <td className="px-4 py-3 text-sm">{formatCurrency(payment.amount)}</td>
                        <td className="px-4 py-3 text-sm">{payment.note}</td>
                        {user?.role === 'admin' && (
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePaymentEdit(payment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <DeleteDialog
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                }
                                title="Xóa thanh toán"
                                description={`Bạn có chắc chắn muốn xóa thanh toán này không? Hành động này không thể hoàn tác.`}
                                onConfirm={() => handlePaymentDelete(payment.id)}
                              />
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}