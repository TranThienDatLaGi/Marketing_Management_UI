import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
export function handleMoneyInput(value: string): number {
  // Bỏ hết ký tự không phải số
  const raw = value.replace(/\D/g, "");

  // Nếu trống thì trả về 0
  return raw === "" ? 0 : Number(raw);
}
export function formatNumber(number: number): string {
  return Number(number || 0).toLocaleString("vi-VN");
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  legal: "Không vi phạm",
  illegal: "Vi phạm",
  "middle-illegal": "Vi phạm nhẹ",
};

export const getProductTypeLabel = (type: string): string => {
  return PRODUCT_TYPE_LABELS[type] ?? "Không xác định";
};

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('vi-VN');
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('vi-VN');
}

export function getWeekRange(date: Date = new Date()): { start: string; end: string } {
  const current = new Date(date);
  const first = current.getDate() - current.getDay() + 1;
  const last = first + 6;

  const startDate = new Date(current.setDate(first));
  const endDate = new Date(current.setDate(last));

  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
}

export function getMonthRange(month: number, year: number): { start: string; end: string } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);

  const csvContent =
    headers.join(',') +
    '\n' +
    data
      .map((row) =>
        headers
          .map((header) => {
            let value = row[header] ?? ''; // tránh undefined/null
            value = String(value);

            // Escape nếu có dấu phẩy, xuống dòng hoặc dấu ngoặc kép
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              value = '"' + value.replace(/"/g, '""') + '"';
            }
            return value;
          })
          .join(',')
      )
      .join('\n');

  // Thêm BOM để Excel đọc đúng UTF-8
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

