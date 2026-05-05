using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Staff.Application.DTOs;
using Staff.Domain.Enums;

namespace Staff.Application.Interfaces;

public interface IStaffService
{
    Task<IEnumerable<StaffDto>> GetAllStaffAsync(string? searchKeyword, StaffStatus? status);
    Task<StaffDto?> GetStaffByIdAsync(Guid id);
    Task<StaffDto> CreateStaffAsync(CreateStaffDto dto);
    Task<bool> UpdateStaffAsync(Guid id, UpdateStaffDto dto);
    Task<bool> DeleteStaffAsync(Guid id);
}
