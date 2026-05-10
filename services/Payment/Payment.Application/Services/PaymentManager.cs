using System;
using System.Threading.Tasks;
using BuildingBlocks.Events;
using Payment.Application.DTOs;
using Payment.Application.Interfaces;
using Payment.Domain.Entities;
using Payment.Domain.Enums;

namespace Payment.Application.Services;

public class PaymentManager : IPaymentService
{
    private readonly IPaymentRepository _repository;
    private readonly IRabbitMQProducer _producer;

    public PaymentManager(IPaymentRepository repository, IRabbitMQProducer producer)
    {
        _repository = repository;
        _producer = producer;
    }

    public async Task<PaymentResponseDto> ProcessPaymentAsync(PaymentRequestDto request)
    {
        // 1. Generate Mock Payment Details based on the method (need Id first — use temp)
        var tempId = Guid.NewGuid();
        string mockDetails = request.Method switch
        {
            PaymentMethod.BankTransfer => $"STK: 123456789 - Ngan hang VCB - Noi dung: CK {tempId}",
            PaymentMethod.VNPay => $"https://vnpay.mock.local/pay?id={tempId}&amount={request.Amount}",
            PaymentMethod.Momo => $"https://momo.mock.local/pay?id={tempId}&amount={request.Amount}",
            _ => "Unknown payment method"
        };

        // 2. Create a pending transaction via factory method
        var transaction = PaymentTransaction.Create(request.BookingId, request.Amount, request.Method, mockDetails);

        // 3. Save to Db
        await _repository.AddAsync(transaction);

        return new PaymentResponseDto
        {
            PaymentId = transaction.Id,
            BookingId = transaction.BookingId,
            Status = transaction.Status.ToString(),
            PaymentUrlOrQrCode = mockDetails,
            Message = "Payment initiated successfully."
        };
    }

    public async Task<bool> ConfirmPaymentAsync(Guid paymentId)
    {
        var transaction = await _repository.GetByIdAsync(paymentId);
        if (transaction == null || transaction.Status == PaymentStatus.Success)
            return false;

        // 1. Update status via domain method
        transaction.MarkAsCompleted();
        await _repository.UpdateAsync(transaction);

        // 2. Publish PaymentCompletedEvent
        var paymentEvent = new PaymentCompletedEvent
        {
            PaymentId = transaction.Id,
            BookingId = transaction.BookingId,
            Amount = transaction.Amount,
            Status = transaction.Status.ToString()
        };
        _producer.PublishEvent(paymentEvent);

        return true;
    }
}
