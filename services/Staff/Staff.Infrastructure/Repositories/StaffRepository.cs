using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Staff.Application.Interfaces;
using Staff.Domain.Entities;
using Staff.Domain.Enums;
using Staff.Infrastructure.Data;

namespace Staff.Infrastructure.Repositories;

public class StaffRepository : IStaffRepository
{
    private readonly StaffDbContext _context;

    public StaffRepository(StaffDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<StaffMember>> GetAllAsync(string? searchKeyword, StaffStatus? status)
    {
        var query = _context.StaffMembers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchKeyword))
        {
            searchKeyword = searchKeyword.ToLower();
            query = query.Where(s => s.FullName.ToLower().Contains(searchKeyword) 
                                  || s.Email.ToLower().Contains(searchKeyword));
        }

        if (status.HasValue)
        {
            query = query.Where(s => s.Status == status.Value);
        }

        return await query.ToListAsync();
    }

    public async Task<StaffMember?> GetByIdAsync(Guid id)
    {
        return await _context.StaffMembers.FindAsync(id);
    }

    public async Task AddAsync(StaffMember staff)
    {
        await _context.StaffMembers.AddAsync(staff);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(StaffMember staff)
    {
        _context.StaffMembers.Update(staff);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var entity = await _context.StaffMembers.FindAsync(id);
        if (entity != null)
        {
            _context.StaffMembers.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }
}
