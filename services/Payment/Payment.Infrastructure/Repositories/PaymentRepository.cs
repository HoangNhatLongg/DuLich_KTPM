using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Payment.Application.Interfaces;
using Payment.Domain.Entities;
using Payment.Infrastructure.Data;

namespace Payment.Infrastructure.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly PaymentDbContext _context;

    public PaymentRepository(PaymentDbContext context)
    {
        _context = context;
    }

    public async Task<PaymentTransaction?> GetByIdAsync(Guid id)
    {
        return await _context.PaymentTransactions.FindAsync(id);
    }

    public async Task<PaymentTransaction?> GetByBookingIdAsync(Guid bookingId)
    {
        return await _context.PaymentTransactions.FirstOrDefaultAsync(x => x.BookingId == bookingId);
    }

    public async Task AddAsync(PaymentTransaction payment)
    {
        await _context.PaymentTransactions.AddAsync(payment);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(PaymentTransaction payment)
    {
        _context.PaymentTransactions.Update(payment);
        await _context.SaveChangesAsync();
    }
}
