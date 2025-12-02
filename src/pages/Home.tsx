import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { TrendingUp, Users, Package, BarChart3 } from 'lucide-react';

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <h1 className="text-3xl text-blue-600">Quản lý Quảng cáo</h1>
          <Link to="/login">
            <Button size="lg">Đăng nhập</Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-20">
          <h2 className="text-5xl mb-6 text-gray-900">
            Hệ thống quản lý chạy quảng cáo
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Quản lý khách hàng, nguồn, hợp đồng và theo dõi lợi nhuận một cách hiệu quả
          </p>
          <Link to="/login">
            <Button size="lg" className="px-8 py-6 text-lg">
              Bắt đầu ngay
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl mb-2">Theo dõi lợi nhuận</h3>
            <p className="text-gray-600">
              Thống kê chi tiết doanh thu và lợi nhuận theo thời gian
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl mb-2">Quản lý khách hàng</h3>
            <p className="text-gray-600">
              Lưu trữ thông tin khách hàng và lịch sử hợp tác
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl mb-2">Quản lý nguồn</h3>
            <p className="text-gray-600">
              Theo dõi nguồn cung cấp và budget chi tiết
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl mb-2">Báo cáo chi tiết</h3>
            <p className="text-gray-600">
              Tổng quan về khách hàng và nguồn theo từng khoảng thời gian
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
