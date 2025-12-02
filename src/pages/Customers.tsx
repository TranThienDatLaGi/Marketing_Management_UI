import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Plus, Edit, Trash2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { AccountType, Customer } from '../types';
import { exportToCSV, getProductTypeLabel } from '../lib/utils';
import { toast } from 'sonner';
import { fetchAccountType, fetchCustomer } from '../lib/fetchData';
import Cookies from 'js-cookie';
import { CUSTOMER } from '../config/API';
import { DeleteDialog } from '../components/ui/DeleteDialogProps';

const ITEMS_PER_PAGE = 5;

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);

  const [open, setOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [rateFilter, setRateFilter] = useState<string>('all');
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const access_token = Cookies.get('accessToken');

  useEffect(() => {
    const loadData = async () => {
      try {
        const customerData = await fetchCustomer();
        setCustomers(customerData)
        const accountTypeData = await fetchAccountType();
        setAccountTypes(accountTypeData);
      } catch (error) {
        console.error("Fetch users failed:", error);
      }
    }
    loadData()
  }, [])
  // Form state
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    zalo: '',
    facebook: '',
    phone_number: '',
    address: '',
    product_type: 'legal',
    account_type_id: '',
    note: '',
    rate: 0.2,
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (rateFilter !== 'all' && customer.rate !== Number(rateFilter)) return false;
      if (productTypeFilter !== 'all' && customer.product_type !== productTypeFilter) return false;
      if (accountTypeFilter !== 'all' && customer.account_type_id !== accountTypeFilter) return false;
      return true;
    });
  }, [customers, rateFilter, productTypeFilter, accountTypeFilter]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

  const productTypes = Array.from(new Set(customers.map((c) => c.product_type)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!access_token) {
      toast.info('Phiên đăng nhập hết hạn vui lòng đăng nhập lại');
    }
    if (editingCustomer) {
      try {
        const response = await fetch(`${CUSTOMER}/${editingCustomer.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${access_token}`
          },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        // console.log("data", data);
        
        if (response.ok) {
          setCustomers(customers.map((c) => (c.id === editingCustomer.id ? { ...c, ...data } : c)));
          toast.success('Cập nhật khách hàng thành công!');
        } else {
          toast.error(`Cập nhật khách hàng thất bại: ${data.message}`);
        }
      } catch (error) {
        console.log("Đã có lỗi trong quá trình cập nhật khách hàng", error);
        toast.error('Đã có lỗi trong quá trình cập nhật khách hàng');
      }
    } else {
      try {
        // console.log('formData: ', formData);
        const response = await fetch(CUSTOMER, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${access_token}`
          },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        // console.log('new customer: ', data);
        if (response.ok) {
          setCustomers([...customers, data]);
          toast.success('Thêm khách hàng thành công!');
        } else {
          toast.error(`Thêm khách hàng thất bại: ${data.message}`);
        }
      } catch (error) {
        console.log("Đã có lỗi trong quá trình thêm khách hàng", error);
        toast.error('Đã có lỗi trong quá trình thêm khách hàng');
      }
    }
    resetForm();
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${CUSTOMER}/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setCustomers(customers.filter((c) => c.id !== id));
        toast.success("Xóa khách hàng thành công!");
      } else {
        toast.error(`Xóa khách hàng thất bại: ${data.message}`);
      }
    } catch (error) {
      console.error("Đã có lỗi trong quá trình xóa khách hàng", error);
      toast.error("Đã có lỗi trong quá trình xóa khách hàng");
    }
  };

  const resetForm = () => {
    setOpen(false);
    setEditingCustomer(null);
    setFormData({
      name: '',
      zalo: '',
      facebook: '',
      phone_number: '',
      address: '',
      product_type: 'legal',
      account_type_id: '',
      note: '',
      rate: 0.2,
    });
  };

  const handleExport = () => {
    const exportData = filteredCustomers.map((customer) => {
      return {
        'Tên': customer.name,
        'Zalo': customer.zalo,
        'Facebook': customer.facebook,
        'Số điện thoại': customer.phone_number,
        'Địa chỉ': customer.address,
        'Loại SP': customer.product_type,
        'Loại TK': customer.account_type_name,
        'Rate': customer.rate,
        'Ghi chú': customer.note,
      };
    });
    exportToCSV(exportData, 'customers');
    toast.success('Xuất dữ liệu thành công!');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl">Quản lý khách hàng</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Xuất Excel
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm khách hàng
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Tên khách hàng *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Số điện thoại *</Label>
                      <Input
                        id="phone"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zalo">Zalo</Label>
                      <Input
                        id="zalo"
                        value={formData.zalo}
                        onChange={(e) => setFormData({ ...formData, zalo: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        value={formData.facebook}
                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Địa chỉ</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="product_type">Loại sản phẩm</Label>
                      <Select
                        value={formData.product_type || ""}
                        onValueChange={(value: 'legal' | 'illegal' |'middle-illegal') => setFormData({ ...formData, product_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại sản phẩm" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="legal" key="legal">
                            Không vi phạm
                          </SelectItem>
                          <SelectItem value="illegal" key="illegal">
                            Vi phạm 
                          </SelectItem>
                          <SelectItem value="middle-illegal" key="middle-illegal">
                            Vi phạm nhẹ
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="account_type">Loại tài khoản</Label>
                      <Select
                        value={formData.account_type_id?.toString() || ""}
                        onValueChange={(value) => setFormData({ ...formData, account_type_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại tài khoản" />
                        </SelectTrigger>
                        <SelectContent>
                          {accountTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="rate">Rate hợp đồng (%)</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                      placeholder="Ví dụ: 0.2 cho 20%"
                    />
                    <p className="text-xs text-gray-500 mt-1">Nhập dạng thập phân (VD: 0.2 = 20%)</p>
                  </div>

                  <div>
                    <Label htmlFor="note">Ghi chú</Label>
                    <Input
                      id="note"
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Hủy
                    </Button>
                    <Button type="submit">
                      {editingCustomer ? 'Cập nhật' : 'Thêm'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4">
          <div>
            <Label>Loại sản phẩm</Label>
            <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {productTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Loại tài khoản</Label>
            <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
              <SelectTrigger className="w-40">
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
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Tên</TableHead>
                  <TableHead className="min-w-[120px]">Zalo</TableHead>
                  <TableHead className="min-w-[150px]">Facebook</TableHead>
                  <TableHead className="min-w-[120px]">SĐT</TableHead>
                  <TableHead className="min-w-[150px]">Địa chỉ</TableHead>
                  <TableHead className="min-w-[120px]">Loại SP</TableHead>
                  <TableHead className="min-w-[120px]">Loại TK</TableHead>
                  <TableHead className="min-w-[80px]">Rate</TableHead>
                  <TableHead className="min-w-[200px]">Ghi chú</TableHead>
                  <TableHead className="min-w-[100px] sticky right-0 bg-white">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((customer) => {
                  return (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.zalo}</TableCell>
                      <TableCell>{customer.facebook}</TableCell>
                      <TableCell>{customer.phone_number}</TableCell>
                      <TableCell>{customer.address}</TableCell>
                      <TableCell>{getProductTypeLabel(customer.product_type)}</TableCell>
                      <TableCell>{customer.account_type_name}</TableCell>
                      <TableCell>
                        {(customer.rate * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell>{customer.note}</TableCell>
                      <TableCell className="sticky right-0 bg-white">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DeleteDialog
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteCustomerId(customer.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            }
                            title="Xóa khách hàng"
                            description={`Bạn có chắc chắn muốn xóa khách hàng "${customer.name}" không? Hành động này không thể hoàn tác.`}
                            onConfirm={() => handleDelete(deleteCustomerId!)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-500">
              Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} đến{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)} trong tổng số{' '}
              {filteredCustomers.length} khách hàng
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center px-4">
                Trang {currentPage} / {totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}