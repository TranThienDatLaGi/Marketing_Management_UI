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
import { fetchCustomer, fetchFilteredBills, fetchPaymentByCustomer } from '../lib/fetchData';
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
  const [dateFrom, setDateFrom] = useState("2025-12-01");
  const [dateTo, setDateTo] = useState(today);

  // Dialog
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [viewPaymentsDialog, setViewPaymentsDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedBillForPayments, setSelectedBillForPayments] = useState<Bill | null>(null);

  const [paymentForm, setPaymentForm] = useState<Partial<Payment>>({
    date: today,
    customer_id: '',
    amount: 0,
    note: '',
  });
  // Current money input for calculation
  const [currentMoney, setCurrentMoney] = useState(0);
  const [currentPagePayment, setCurrentPagePayment] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(payments.length / itemsPerPage);

  const paginatedPayments = payments.slice(
    (currentPagePayment - 1) * itemsPerPage,
    currentPagePayment * itemsPerPage
  );

  useEffect(() => {
    const loadData = async () => {
      const customerData = await fetchCustomer();
      setCustomers(customerData)
      const res = await fetchFilteredBills({
        customer_id: customerFilter,
        status: statusFilter,
        from_date: dateFrom,
        to_date: dateTo,
        page: currentPage,
        per_page: 10
      });
      // console.log("billsData", res);
      if(res){
        const billsData = res.data;
        
        setBills(billsData);
        setPage({
          from: res.pagination.from,
          to: res.pagination.to,
          total: res.pagination.total,
          next_page_url: res.pagination.next_page_url || null,
          prev_page_url: res.pagination.prev_page_url || null,
          last_page: res.pagination.last_page,
        });
      }
      
    }
    loadData();
  }, [customerFilter, statusFilter, dateFrom, dateTo, currentPage,payments])
  // Calculate totals
  const totals = useMemo(() => {
    const safeBills = Array.isArray(bills) ? bills : [];

    return {
      totalMoney: safeBills.reduce(
        (sum, b) => sum + Number(b?.total_money || 0),
        0
      ),
      totalPaid: safeBills.reduce(
        (sum, b) => sum + Number(b?.paid_amount || 0),
        0
      ),
      totalDeposit: safeBills.reduce(
        (sum, b) => sum + Number(b?.deposit_amount || 0),
        0
      ),
      totalDebt: safeBills.reduce(
        (sum, b) => sum + Number(b?.debt_amount || 0),
        0
      ),
    };
  }, [bills]);

  // ✅ Calculate difference (an toàn)
  const calculationDifference =
    totals.totalDebt + Number(currentMoney || 0) - totals.totalDeposit;

  const handleExport = () => {
    const exportData = bills.map((bill) => {
      return {
        'Ngày': formatDate(today),
        'Khách hàng': bill.customer_name,
        'Sản phẩm': bill.product,
        'Tổng tiền': bill.total_money,
        'Đã trả': bill.paid_amount,
        'Còn nợ': bill.debt_amount,
        'Tiền cọc': bill.deposit_amount,
        'Trạng thái':
          bill.status === 'completed' ? 'Hoàn thành' : bill.status === 'deposit' ? 'Đặt cọc' : 'Còn nợ',
      };
    });

    exportToCSV(exportData, `bills_${today}`);
    toast.success('Xuất dữ liệu thành công!');
  };
  const handleExportPayment = () => {
    const exportData = payments.map((payment) => {
      return {
        'Ngày': formatDate(payment.date),
        'Số tiền': payment.amount,
        'Ghi chú': payment.note,
      };
    });

    exportToCSV(exportData, `paymentfor_${selectedBillForPayments?.customer_name}_${today}`);
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
    setViewPaymentsDialog(false);
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
    setViewPaymentsDialog(false);
    
  };

  const resetPaymentForm = () => {
    setPaymentDialog(false);
    setEditingPayment(null);
    setPaymentForm({
      date: today,
      customer_id: '',
      amount: 0,
      note: '',
    });
  };
  const handleViewPayments = async (bill: Bill) => {
    setSelectedBillForPayments(bill);
    const paymentData = await fetchPaymentByCustomer(bill.customer_id,dateFrom,dateTo);
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
        <div>
          {calculationDifference === 0 ? (
            // 🎉 TRƯỜNG HỢP TÍNH ĐÚNG
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-green-700">
                ✅ Số tiền sau tính toán là{" "}
                <strong>{formatCurrency(Math.abs(calculationDifference))}</strong>.
                Bạn đã tính đúng rồi!
              </p>
              <p className="text-sm text-green-600 mt-1">
                Công thức: Tiền nợ ({formatCurrency(totals.totalDebt)}) + Tiền hiện tại (
                {formatCurrency(currentMoney)}) - Tiền cọc ({formatCurrency(totals.totalDeposit)})
                = {formatCurrency(calculationDifference)}
              </p>
            </div>
          ) : (
            // ⚠️ TRƯỜNG HỢP TÍNH SAI
            <div
              className={
                calculationDifference > 0
                  ? "bg-red-50 border border-red-200 p-4 rounded-lg"
                  : "bg-blue-50 border border-blue-200 p-4 rounded-lg"
              }
            >
              <p
                className={
                  calculationDifference > 0 ? "text-red-700" : "text-blue-700"
                }
              >
                ⚠️ Số tiền sau tính toán là{" "}
                <strong>{formatCurrency(Math.abs(calculationDifference))}</strong>
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
                {formatCurrency(currentMoney)}) - Tiền cọc ({formatCurrency(totals.totalDeposit)})
                = {formatCurrency(calculationDifference)}
              </p>
            </div>
          )}
        </div>
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
                  <th className="px-4 py-3 text-left text-sm min-w-[150px]">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[180px]">Sản phẩm</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[120px]">Tiền chạy</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[120px]">Tiền chuyển</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[120px]">Còn nợ</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[120px]">Còn cọc</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[100px]">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm min-w-[100px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(bills) ? bills : []).map((bill) => (
                  <tr key={bill.customer_id} className="border-t">
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
                    <td className="px-4 py-3 text-sm">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewPayments(bill)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
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

        {/* Payment Dialog */}
        <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPayment ? 'Sửa thanh toán' : 'Thêm thanh toán mới'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              {/* Ngày */}
              <div className="space-y-2">
                <Label htmlFor="date">Ngày *</Label>
                <Input
                  id="date"
                  type="date"
                  value={paymentForm.date ?? ""}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, date: e.target.value })
                  }
                />
              </div>
              {/* Số tiền */}
              <div className="space-y-2">
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

              {/* Ghi chú */}
              <div className="space-y-2">
                <Label htmlFor="note">Ghi chú *</Label>
                <Textarea
                  id="note"
                  value={paymentForm.note ?? ""}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, note: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
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
          <DialogContent className="max-w-5xl h-[50vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Danh sách thanh toán</DialogTitle>
            </DialogHeader>
            <Button variant="outline" onClick={handleExportPayment}>
              <Download className="mr-2 h-4 w-4" />
              Xuất Excel
            </Button>
            <div className="space-y-4 mt-4">

              <div className="space-y-4">
                {selectedBillForPayments && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm text-gray-500">Khách hàng</p>
                      <p>{selectedBillForPayments.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Sản phẩm</p>
                      <p>{selectedBillForPayments.product}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tổng tiền</p>
                      <p className="text-gray-700">
                        {formatCurrency(selectedBillForPayments.total_money)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Đã trả</p>
                      <p className="text-green-600">
                        {formatCurrency(selectedBillForPayments.paid_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Còn nợ</p>
                      <p className="text-red-600">
                        {formatCurrency(selectedBillForPayments.debt_amount)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <h3 className="text-lg">Lịch sử thanh toán</h3>
                  <Button
                    onClick={() => {
                      setPaymentForm({
                        ...paymentForm,
                        customer_id: selectedBillForPayments?.customer_id || "",
                      });
                      setPaymentDialog(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm thanh toán
                  </Button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm">Ngày</th>
                        <th className="px-4 py-3 text-left text-sm">Số tiền</th>
                        <th className="px-4 py-3 text-left text-sm">Ghi chú</th>
                        {user?.role === "admin" && (
                          <th className="px-4 py-3 text-left text-sm">Thao tác</th>
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedPayments.map((payment) => (

                        <tr key={payment.id} className="border-t">
                          <td className="px-4 py-3 text-sm">
                            {formatDate(payment.date)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-normal break-words">
                            {payment.note}
                          </td>

                          {user?.role === "admin" && (
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
                                    <Button variant="ghost" size="icon">
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  }
                                  title="Xóa thanh toán"
                                  description="Bạn có chắc chắn muốn xóa thanh toán này không? Hành động này không thể hoàn tác."
                                  onConfirm={() => handlePaymentDelete(payment.id)}
                                />
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between items-center mt-4">
                    <p>
                      Hiển thị {(currentPagePayment - 1) * itemsPerPage + 1}–
                      {Math.min(currentPagePayment * itemsPerPage, payments.length)}
                      / {payments.length} thanh toán
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <Button
                      variant="outline"
                      disabled={currentPagePayment === 1}
                      onClick={() => setCurrentPagePayment((p) => p - 1)}
                    >
                      Trang trước
                    </Button>

                    <p>
                      Trang {currentPagePayment} / {totalPages}
                    </p>

                    <Button
                      variant="outline"
                      disabled={currentPagePayment === totalPages}
                      onClick={() => setCurrentPagePayment((p) => p + 1)}
                    >
                      Trang sau
                    </Button>
                  </div>

                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}