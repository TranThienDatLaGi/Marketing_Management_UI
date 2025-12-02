import React, { useState } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './dialog';
import { Button } from './button';

interface DeleteDialogProps {
    title?: string;
    description?: string;
    onConfirm: () => Promise<void> | void;
    trigger: React.ReactNode; // component mở modal, ví dụ nút "Xóa"
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
    title = "Xác nhận xóa",
    description = "Bạn có chắc chắn muốn thực hiện hành động này? Hành động này không thể hoàn tác.",
    onConfirm,
    trigger,
}) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
            setOpen(false);
        } catch (error) {
            console.error("Lỗi khi thực hiện xóa:", error);
            toast.error("Đã có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Hủy
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
                        {loading ? "Đang xóa..." : "Xác nhận"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
