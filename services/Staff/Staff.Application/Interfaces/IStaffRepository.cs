using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Staff.Domain.Entities;
using Staff.Domain.Enums;

namespace Staff.Application.Interfaces;

public interface IStaffRepository
{
    Task<IEnumerable<StaffMember>> GetAllAsync(string? searchKeyword, StaffStatus? status);
    Task<StaffMember?> GetByIdAsync(Guid id);
    Task AddAsync(StaffMember staff);
    Task UpdateAsync(StaffMember staff);
    Task DeleteAsync(Guid id);
}
