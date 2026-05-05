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
        // 1. Create a pending transaction
        var transaction = new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            BookingId = request.BookingId,
            Amount = request.Amount,
            Method = request.Method,
            Status = PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        // 2. Generate Mock Payment Details based on the method
        string mockDetails = request.Method switch
        {
            PaymentMethod.BankTransfer => $"STK: 123456789 - Ngan hang VCB - Noi dung: CK {transaction.Id}",
            PaymentMethod.VNPay => $"https://vnpay.mock.local/pay?id={transaction.Id}&amount={request.Amount}",
            PaymentMethod.Momo => $"https://momo.mock.local/pay?id={transaction.Id}&amount={request.Amount}",
            _ => "Unknown payment method"
        };
        transaction.PaymentDetails = mockDetails;

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

        // 1. Update status
        transaction.Status = PaymentStatus.Success;
        transaction.ProcessedAt = DateTime.UtcNow;
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
