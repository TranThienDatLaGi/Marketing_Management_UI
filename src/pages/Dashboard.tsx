import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { formatCurrency } from '../lib/utils';
import { BarChart3, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { fetchDashboard } from '../lib/fetchData';
type TimeFilter = 'date' | 'week' | 'month' | 'year';

export function Dashboard() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeek, setSelectedWeek] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [dashboardData, setDashboardData] = useState({
    period: {
      from: "",
      to: "",
    },
    total_contracts: 0,
    revenue: 0,
    profit: 0,
    received: 0, // ✔️ thêm mới
    top_account_type: "",
    account_types: [] as { name: string; count: number }[],
    products: [] as { product: string; count: number }[],
    customers: [] as {
      customer_id: number;
      customer_name: string;
      count: number;
    }[],
    suppliers: [] as {
      supplier_id: number;
      supplier_name: string;
      count: number;
    }[],
  });

  const getValue = (value : 'date' | 'week' | 'month' | 'year')=>{
    if(value==="date")
      return selectedDate
    else if (value ==="week")
      return selectedWeek
    else if (value ==="month")
      return selectedMonth
    else return selectedYear
  }
  useEffect(() => {
      const loadData = async () => {
        try {
          const selectedValue = getValue(timeFilter)
          const dataDashboard = await fetchDashboard(timeFilter, selectedValue);
          // console.log("dataDashboard", dataDashboard);
          setDashboardData(dataDashboard);
        } catch (error) {
          console.error("Fetch data failed:", error);
        }
      }
      loadData()
  }, [timeFilter, selectedDate, selectedWeek, selectedMonth, selectedYear])
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl">Dashboard</h1>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Xem theo</Label>
              <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Ngày</SelectItem>
                  <SelectItem value="week">Tuần</SelectItem>
                  <SelectItem value="month">Tháng</SelectItem>
                  <SelectItem value="year">Năm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Chọn {timeFilter === 'date' ? 'ngày' : timeFilter === 'week' ? 'ngày trong tuần' : timeFilter === 'month' ? 'tháng' : 'năm'}</Label>
              {timeFilter === 'date' && (
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="cursor-pointer [color-scheme:light]"
                />
              )}
              {timeFilter === 'week' && (
                <Input
                  type="date"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="cursor-pointer [color-scheme:light]"
                />
              )}
              {timeFilter === 'month' && (
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="cursor-pointer [color-scheme:light]"
                />
              )}
              {timeFilter === 'year' && (
                <Input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  min="2000"
                  max="2100"
                  className="cursor-pointer"
                />
              )}
            </div>
          </div>
          {/* <div className="mt-3 text-sm text-gray-600">
            Đang xem dữ liệu: <strong>{getTimeFilterText()}</strong>
          </div> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Số hợp đồng</p>
                <p className="text-3xl mt-2">{dashboardData.total_contracts}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng tiền nhận</p>
                <p className="text-xl mt-2">{formatCurrency(dashboardData.received || 0)}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Doanh số (Tiền chạy)</p>
                <p className="text-2xl mt-2 text-blue-600">{formatCurrency(dashboardData.revenue)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Lợi nhuận</p>
                <p className={`text-2xl mt-2 ${dashboardData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(dashboardData.profit)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl mb-4">Loại tài khoản</h2>
            <div className="space-y-3">
              {dashboardData.account_types.map((item) => (
                <div key={item.name} className="flex justify-between items-center">
                  <span className="text-sm">{item.name}</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                    {item.count} lần
                  </span>
                </div>
              ))}
              {dashboardData.account_types.length === 0 && (
                <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
              )}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl mb-4">Khách hàng và số lần chạy</h2>
            <div className="space-y-3">
              {dashboardData.customers.map((item) => (
                <div key={item.customer_id} className="flex justify-between items-center">
                  <span className="text-sm">{item.customer_name}</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                    {item.count} lần
                  </span>
                </div>
              ))}
              {dashboardData.customers.length === 0 && (
                <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
              )}

            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl mb-4">Nguồn và số lần chạy</h2>
            <div className="space-y-3">
              {dashboardData?.suppliers?.length > 0 ? (
                dashboardData.suppliers.map((item) => (
                  <div
                    key={item.supplier_id}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm">{item.supplier_name}</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                      {item.count} lần
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
              )}
            </div>

          </div>

          
        </div>
      </div>
    </Layout>
  );
}