import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Supplier } from '../types';
import { fetchOverviewSupplier, fetchSupplier } from '../lib/fetchData';
import { formatCurrency } from '../lib/utils';

export function OverviewSupplier() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentYear = String(now.getFullYear());
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [month, setMonth] = useState(currentMonth); // "01".."12"
  const [year, setYear] = useState(currentYear);     // "2025"
  const [showOverview, setShowOverview] = useState(false);
  const [overviewSupplier, setOverviewSupplier] = useState<any>('');
  const [data, setData] = useState({
    total_budget_count: 0,
    total_budget_money: 0,
    budget_by_account_type: {},
    total_payable: 0,
  });
  useEffect(() => {
    const loadData = async () => {
      try {
        const supplierData = await fetchSupplier();
        setSuppliers(supplierData);
        setSelectedSupplier(supplierData[0].id);
      } catch (error) {
        console.error("Lỗi load data:", error);
      }
    };
    loadData();
  }, []);


  const handleOverviewSupplier = async () => {
    try {
      const period = `${year}-${month}`;
      const overviewData = await fetchOverviewSupplier(selectedSupplier, period);
      if (!overviewData) {
        toast.success(`Tháng ${month} năm ${year} không có dữ liệu nào cho khách này!`);
        setShowOverview(false);
        return
      }
      const parsed = JSON.parse(overviewData.overview.data);
      setOverviewSupplier(overviewData);
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
          <h1 className="text-3xl">Tổng quan nguồn</h1>
          <Button variant="outline"
            onClick={() => {
              setShowOverview(true);
              handleOverviewSupplier()
            }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tải tổng quan hoạt động
          </Button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm mb-2">Chọn nguồn</label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
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

            <div>
              <label className="block text-sm mb-2">Tháng</label>
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
              <label className="block text-sm mb-2">Năm</label>
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
          {overviewSupplier && showOverview && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Thông tin nguồn</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Tên nguồn</p>
                    <p>{overviewSupplier.supplier.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p>{overviewSupplier.supplier.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Zalo</p>
                    <p>{overviewSupplier.supplier.zalo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Địa chỉ</p>
                    <p>{overviewSupplier.supplier.address}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tổng quan hoạt động</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">
                    - Tháng {month}/{year} này nguồn có <b>{data.total_budget_count}</b> ngân sách. <br />
                    <br />
                    - Trong đó có
                    {/* Chạy theo account type */}
                    {Object.values(data?.budget_by_account_type ?? {}).map((item: any) => (
                      <span key={item.id} className="block">
                        <b>{item.count}</b> lần chạy <b>{item.name}</b> với ngân sách là <b>{formatCurrency(item.total_money)}</b>.
                      </span>
                    ))}
                    <br />
                    Số tiền phải đưa cho nguồn là <b>{formatCurrency(data.total_payable)}</b>,
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