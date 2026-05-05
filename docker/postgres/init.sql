-- =====================================================
-- Init script: tạo tất cả databases khi postgres khởi động
-- Chạy tự động lần đầu qua docker-entrypoint-initdb.d
-- =====================================================

CREATE DATABASE "UserServiceDb";
CREATE DATABASE "TourDb";
CREATE DATABASE "BookingDb";
CREATE DATABASE "PaymentDb";
CREATE DATABASE "StaffDb";
CREATE DATABASE "ReportDb";
