import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatCurrency, getMonthRange } from '../lib/utils';
import { Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Customer } from '../types';
import { fetchCustomer, fetchOverviewCustomer } from '../lib/fetchData';

export function OverviewCustomer() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentYear = String(now.getFullYear());

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [month, setMonth] = useState(currentMonth); // "01".."12"
  const [year, setYear] = useState(currentYear);     // "2025"
  
  const [showOverview, setShowOverview] = useState(false);
  const [overviewCustomer, setOverviewCustomer] = useState<any>('');
  const [data, setData] = useState({
    total_runs: 0,
    runs_by_account_type: {},
    runs_by_product: {},
    total_money: 0,
    total_debt: 0,
    total_paid: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const customerData = await fetchCustomer();
        if (customerData){
          setCustomers(customerData)
          setSelectedCustomer(customerData[0].id)
        }
      } catch (error) {
        console.error("Fetch users failed:", error);
      }
    }
    loadData()
  }, [])
  const handleOverviewCustomer = async () => {
    try {
      const period = `${year}-${month}`;
      const overviewData = await fetchOverviewCustomer(selectedCustomer, period);
      if (!overviewData){
        toast.success(`Tháng ${month} năm ${year} không có dữ liệu nào cho khách này!`);
        setShowOverview(false);
        return
      }
      const parsed = JSON.parse(overviewData.overview.data);
      setOverviewCustomer(overviewData);
      setData(parsed); 
      toast.success('Đã tải tổng quan hoạt động!');
    } catch (error) {
      console.error("Fetch users failed:", error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl">Tổng quan khách hàng</h1>
          <Button variant="outline"
            onClick={() => {
              setShowOverview(true);
              handleOverviewCustomer()
            }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tải tổng quan hoạt động
          </Button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm mb-2">Chọn khách hàng</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue />
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
            <div>
              <label className="block text-sm mb-2">Chọn tháng</label>
              <Select value={month} onValueChange={(v) => setMonth(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                    <SelectItem key={m} value={m}>
                      Tháng {Number(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-2">Chọn năm</label>
              <Select value={year} onValueChange={(v) => setYear(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {overviewCustomer.customer && showOverview && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Thông tin khách hàng</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Tên</p>
                    <p>{overviewCustomer.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p>{overviewCustomer.customer.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email / Facebook</p>
                    <p>{overviewCustomer.customer.facebook}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Địa chỉ</p>
                    <p>{overviewCustomer.customer.address}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tổng quan hoạt động</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">
                    - Tháng {month}/{year} khách hàng đã chạy quảng cáo <b>{data.total_runs}</b> lần. <br />
                    <br />
                    - Trong đó có
                    {/* Chạy theo account type */}
                    {Object.values(data?.runs_by_account_type ?? {}).map((item: any) => (
                      <span key={item.id} className="block">
                         <b>{item.count}</b> lần chạy <b>{item.name}</b>.
                      </span>
                    ))}

                    <br />

                    {Object.entries(data?.runs_by_product ?? {}).map(([productName, count]: any) => (
                      <span key={productName} className="block">
                        Có <b>{count}</b> lần chạy cho sản phẩm <b>{productName}</b>.
                      </span>
                    ))}


                    <br />
                    Số tiền khách phải bỏ ra là <b>{formatCurrency(data.total_money)}</b>,
                    khách đã trả <b>{formatCurrency(data.total_paid)} ₫</b>,
                    khách còn nợ <b>{formatCurrency(data.total_debt)} ₫</b>.
                  </p>

                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}