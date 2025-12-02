import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { mockUsers } from '../lib/mockData';
import { User } from '../types';
import { formatDate } from '../lib/utils';
import { Plus, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../lib/authContext';
import { fetchUsers } from '../lib/fetchData';
import { REGISTER, SEND_VERIFY_EMAIL, UPDATE_USER } from '../config/API';
import Cookies from 'js-cookie';

export function Accounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await fetchUsers();
        // console.log("users:", users);

        setAccounts(users);
      } catch (err) {
        console.error("Fetch users failed:", err);
      }
    };
    loadUsers();
  }, []);
  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-2xl mb-4">Không có quyền truy cập</h2>
          <p className="text-gray-600">Chỉ admin mới có quyền quản lý tài khoản</p>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    const newAccount: User = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      password: 'Asdfg@123',
      role: 'manager',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    try {
      const response = await fetch(REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(newAccount),
      });
      const data = await response.json();
      if (response.ok) {
        try {
          const verifyRes = await fetch(SEND_VERIFY_EMAIL, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify({ email: newAccount.email }),
          });

          const verifyData = await verifyRes.json();

          if (verifyRes.ok) {
            toast.success(`Đã gửi mail xác nhận đến ${newAccount.email}`);
          } else {
            toast.error(`Gửi mail thất bại: ${verifyData.message}`);
          }
        } catch (err) {
          console.error("Gửi mail lỗi:", err);
          toast.error("Gửi mail lỗi!");
        }
        const existingIndex = accounts.findIndex(u => u.email === data.user.email);
        if (existingIndex !== -1) {
          const updatedUsers = [...accounts];
          updatedUsers[existingIndex].name = data.user.name;
          setAccounts(updatedUsers);
        } else {
          // Nếu chưa tồn tại, thêm user mới
          setAccounts([...accounts, data.user]);
        }
        toast.success('Tạo tài khoản thành công! Mật khẩu mặc định: Asdfg@123');
        setOpen(false);
      } else {
        console.error("Lỗi khi tạo tài khoản:", data.message);
        return [];
      }
    } catch (err) {
      console.error("Đã có lỗi trong quá trình tạo tài khoản:", err);
      return [];
    }
    setFormData({ name: '', email: '' });
  };

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const access_token = Cookies.get('accessToken');
    try {
      const response = await fetch(UPDATE_USER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
        body: JSON.stringify({ id: user.id, status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        // Cập nhật lại danh sách user trong state
        setAccounts(prev =>
          prev.map(u =>
            u.id === user.id
              ? { ...u, status: newStatus }
              : u
          )
        );
        toast.success(`Account status changed to ${newStatus}`);
      } else {
        console.error(`Failed to change status: ${data.message}`);
        toast.error(`Failed to change status: ${data.message}`);
      }
    } catch (err) {
      console.error("Error changing user status:", err);
      toast.error("An error occurred while changing status.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl">Quản lý tài khoản</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tạo tài khoản
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo tài khoản nhân viên</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Họ và tên *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded text-sm">
                  <p>
                    <strong>Vai trò:</strong> Manager (mặc định)
                  </p>
                  <p>
                    <strong>Mật khẩu:</strong> Asdfg@123 (mặc định)
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit">Tạo tài khoản</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm">Email</th>
                <th className="px-4 py-3 text-left text-sm">Tên</th>
                <th className="px-4 py-3 text-left text-sm">Vai trò</th>
                <th className="px-4 py-3 text-left text-sm">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm">Ngày tạo</th>
                <th className="px-4 py-3 text-left text-sm">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-t">
                  <td className="px-4 py-3 text-sm">{account.email}</td>
                  <td className="px-4 py-3 text-sm">{account.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="capitalize px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {account.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        account.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {account.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatDate(account.created_at)}</td>
                  <td className="px-4 py-3 text-sm">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleStatus(account)}
                      title={account.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    >
                      {account.status === 'active' ? (
                        <PowerOff className="h-4 w-4 text-red-500" />
                      ) : (
                        <Power className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
