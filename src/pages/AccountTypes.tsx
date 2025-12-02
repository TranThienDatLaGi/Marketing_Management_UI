import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { AccountType } from '../types';
import { toast } from 'sonner';
import { fetchAccountType } from '../lib/fetchData';
import Cookies from 'js-cookie';
import { ACCOUNT_TYPE } from '../config/API';
import { DeleteDialog } from '../components/ui/DeleteDialogProps';

export function AccountTypes() {
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [open, setOpen] = useState(false);
  const [editingType, setEditingType] = useState<AccountType | null>(null);
  const [formData, setFormData] = useState<Partial<AccountType>>({
    name: '',
    description: '',
    note: '',
  });
  const [deleteAccountTypeId, setDeleteAccountTypeId] = useState<string | null>(null);
  const access_token = Cookies.get('accessToken');
  useEffect(() => {
    const loadData = async () => {
      try {
        const accountTypeData = await fetchAccountType();
        setAccountTypes(accountTypeData)
      } catch (error) {
        console.error("Fetch users failed:", error);
      }
    }
    loadData()
  }, []);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = accountTypes ? accountTypes.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = accountTypes ? Math.ceil(accountTypes.length / itemsPerPage) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!access_token) {
      toast.info('Phiên đăng nhập hết hạn vui lòng đăng nhập lại');
    }
    if (editingType) {
      try {
        const response = await fetch(`${ACCOUNT_TYPE}/${editingType.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${access_token}`
          },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (response.ok) {
          setAccountTypes(
            accountTypes.map((type) =>
              type.id === editingType.id ? { ...type, ...data } : type
            )
          );
          toast.success('Cập nhật loại tài khoản thành công!');
        } else {
          toast.error(`Cập nhật loại tài khoản thất bại: ${data.message}`);
        }

      } catch (error) {
        console.log("Đã có lỗi trong quá trình cập nhật loại tài khoản", error);
        toast.error('Đã có lỗi trong quá trình cập nhật loại tài khoản');
      }

    } else {
      try {
        const response = await fetch(ACCOUNT_TYPE, {
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
        // console.log('data: ', data);

        if (response.ok) {
          setAccountTypes([...accountTypes, data]);
          toast.success('Thêm loại tài khoản thành công!');
        } else {
          toast.error(`Thêm loại tài khoản thất bại: ${data.message}`);
        }
      } catch (error) {
        console.log("Đã có lỗi trong quá trình cập nhật loại tài khoản", error);
        toast.error('Đã có lỗi trong quá trình cập nhật loại tài khoản');
      }

    }
    resetForm();
  };

  const handleEdit = (type: AccountType) => {
    setEditingType(type);
    setFormData(type);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
      try {
        const response = await fetch(`${ACCOUNT_TYPE}/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${access_token}`
          },
        });
        const data = await response.json();
        if (response.ok) {
          setAccountTypes(accountTypes.filter((type) => type.id !== id));
          toast.success('xóa loại tài khoản thành công!');
        } else {
          toast.error(`xóa loại tài khoản thất bại: ${data.message}`);
        }

      } catch (error) {
        console.log("Đã có lỗi trong quá trình xóa loại tài khoản", error);
        toast.error('Đã có lỗi trong quá trình xóa loại tài khoản');
      }
  };

  const resetForm = () => {
    setOpen(false);
    setEditingType(null);
    setFormData({
      name: '',
      description: '',
      note: '',
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl">Quản lý loại tài khoản</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Thêm loại tài khoản
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingType ? 'Chỉnh sửa loại tài khoản' : 'Thêm loại tài khoản mới'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Tên loại tài khoản *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="note">Lưu ý</Label>
                  <Textarea
                    id="note"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Hủy
                  </Button>
                  <Button type="submit">{editingType ? 'Cập nhật' : 'Thêm'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên loại tài khoản</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Lưu ý</TableHead>
                <TableHead className="w-[100px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>{type.name}</TableCell>
                  <TableCell>{type.description}</TableCell>
                  <TableCell>{type.note}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(type)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DeleteDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteAccountTypeId(type.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        }
                        title="Xóa khách hàng"
                        description={`Bạn có chắc chắn muốn xóa khách hàng "${type.name}" không? Hành động này không thể hoàn tác.`}
                        onConfirm={() => handleDelete(deleteAccountTypeId!)}
                      />
                  </div>
                </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span>
          Trang {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
    </Layout >
  );
}