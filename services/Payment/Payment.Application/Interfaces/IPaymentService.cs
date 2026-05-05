using System;
using System.Threading.Tasks;
using Payment.Application.DTOs;

namespace Payment.Application.Interfaces;

public interface IPaymentService
{
    Task<PaymentResponseDto> ProcessPaymentAsync(PaymentRequestDto request);
    Task<bool> ConfirmPaymentAsync(Guid paymentId);
}
