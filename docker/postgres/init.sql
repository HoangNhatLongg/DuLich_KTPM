-- =====================================================
-- Init script: tạo tất cả databases khi postgres khởi động
-- Chạy tự động lần đầu qua docker-entrypoint-initdb.d
-- =====================================================

CREATE DATABASE "UserServiceDb";
CREATE DATABASE "TourServiceDb";
CREATE DATABASE "BookingServiceDb";
CREATE DATABASE "PaymentDb";
CREATE DATABASE "StaffDb";
CREATE DATABASE "ReportDb";

-- Favorites table for storing user's favorite tours
-- Connected to BookingServiceDb
