interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    // thêm các biến VITE_ khác nếu có
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
