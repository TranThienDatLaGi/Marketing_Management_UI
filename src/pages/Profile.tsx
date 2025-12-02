import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Layout } from '../components/Layout';
import { Eye, EyeOff, Save } from 'lucide-react';
import { toast } from 'sonner';
import { CHANGE_PASSWORD, CHECK_PASSWORD, UPDATE_USER } from '../config/API';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { log } from 'console';

export function Profile() {
  const { getCurrentUser, logout, updateProfile } = useAuth();
  const user = getCurrentUser();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const access_token = Cookies.get('accessToken');
  const navigate = useNavigate();

  const validatePassword = (password: string): boolean => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    return regex.test(password);
  };  
  const handleUpdateProfile = async(e: React.FormEvent) => {
    e.preventDefault();
    // console.log("name", name);
    try {
      const response = await fetch(UPDATE_USER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          id: user?.id,
          name: name,
        }),
      });

      const data = await response.json();
      // console.log("data:",data);
      
      updateProfile(data.user);
      if (response.ok) {
        // Cập nhật lại danh sách user trong state
        toast.success(`Tài khoản đã được cập nhật thành công`);
      } else {
        console.error(`Đã có lỗi khi cập nhật lại tài khoản : ${data.message}`);
        toast.error(`Đã có lỗi khi cập nhật lại tài khoản: ${data.message}`);
      }
    } catch (err) {
      console.error("Đã có lỗi trong quá trình cập nhật lại tài khoản:", err);
      toast.error("Đã có lỗi trong quá trình cập nhật lại tài khoản.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch(CHECK_PASSWORD, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        email: user?.email,
        password: currentPassword,
      }),
    });
    // console.log('email', user?.email);
    // console.log('currentPassword', currentPassword);

    if (!response.ok) {
      toast.success('Mật khẩu hiện tại không đúng');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!validatePassword(newPassword)) {
      toast.error(
        'Mật khẩu phải có 8-20 ký tự, bao gồm chữ thường, chữ hoa, số và ký tự đặc biệt'
      );
      return;
    }
    try {
      const response = await fetch(CHANGE_PASSWORD, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          id: user?.id,
          new_password: newPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Mật khẩu đã được cập nhật, hãy đăng nhập lại');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        logout();
        navigate('/');
      } else {
        // console.error(`Failed to change Password  : ${data.message}`);
        toast.error(`Đã có lỗi khi đổi mật khẩu: ${data.message}`);
      }
    } catch (err) {
      // console.error("Error changing password:", err);
      toast.error("Đã có lỗi xảy ra trong quá trình đổi mật khẩu");
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl mb-8">Thông tin cá nhân</h1>

        <div className="grid gap-8">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl mb-6">Thông tin tài khoản</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label htmlFor="name">Họ và tên</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email}
                  required
                  disabled
                />
              </div>

              <div>
                <Label>Vai trò</Label>
                <Input value={user?.role} disabled className="capitalize" />
              </div>

              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Lưu thay đổi
              </Button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl mb-6">Đổi mật khẩu</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  8-20 ký tự, bao gồm chữ thường, chữ hoa, số và ký tự đặc biệt
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit">Đổi mật khẩu</Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
