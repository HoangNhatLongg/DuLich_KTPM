# Perf Test Scripts

Bo script nay dung PowerShell de test nhanh cac chuc nang chinh cua prototype.

## Yeu cau

- He thong da chay tren Docker hoac local
- PowerShell co the goi HTTP toi cac service

## Cach chay

Chay tat ca:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\perf\test-system.ps1 -Mode all -Count 5
```

Chay rieng tung bai:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\perf\test-system.ps1 -Mode register -Count 10
powershell -ExecutionPolicy Bypass -File .\scripts\perf\test-system.ps1 -Mode login -Count 10
powershell -ExecutionPolicy Bypass -File .\scripts\perf\test-system.ps1 -Mode tours -Count 20
powershell -ExecutionPolicy Bypass -File .\scripts\perf\test-system.ps1 -Mode booking -Count 5
powershell -ExecutionPolicy Bypass -File .\scripts\perf\test-system.ps1 -Mode payment -Count 5
powershell -ExecutionPolicy Bypass -File .\scripts\perf\test-system.ps1 -Mode e2e -Count 5
```

## Y nghia tung mode

- `register`: tao user moi
- `login`: login cac user vua tao
- `tours`: goi endpoint lay danh sach tour
- `booking`: dang ky user, login, tao booking
- `payment`: tao booking va process payment
- `e2e`: tao booking, process payment, simulate payment, doi booking chuyen sang `Paid`
- `all`: chay tat ca cac bai theo thu tu

## Tham so hay dung

- `-Count`: so lan lap hoac so user test
- `-UseGatewayForTours`: goi `GET /api/tours` qua gateway
- `-UseGatewayForBookings`: goi booking qua gateway
- `-PollSeconds`: thoi gian doi booking chuyen sang `Paid`

Vi du:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\perf\test-system.ps1 -Mode tours -Count 50 -UseGatewayForTours
```

## Ghi chu

- Script nay phu hop de test chuc nang va test tai nhe.
- Neu can test hieu nang nghiem tuc hon, nen dung them `k6` hoac `JMeter`.
- Truoc khi chay `booking` va `e2e`, can dam bao `TourService`, `BookingService`, `PaymentService`, `RabbitMQ` va `PostgreSQL` dang hoat dong on dinh.
