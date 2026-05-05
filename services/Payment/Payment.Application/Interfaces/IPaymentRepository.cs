using System;
using System.Threading.Tasks;
using Payment.Domain.Entities;

namespace Payment.Application.Interfaces;

public interface IPaymentRepository
{
    Task<PaymentTransaction?> GetByIdAsync(Guid id);
    Task<PaymentTransaction?> GetByBookingIdAsync(Guid bookingId);
    Task AddAsync(PaymentTransaction payment);
    Task UpdateAsync(PaymentTransaction payment);
}
