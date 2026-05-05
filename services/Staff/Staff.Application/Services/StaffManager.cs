using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Staff.Application.DTOs;
using Staff.Application.Interfaces;
using Staff.Domain.Entities;
using Staff.Domain.Enums;

namespace Staff.Application.Services;

public class StaffManager : IStaffService
{
    private readonly IStaffRepository _repository;

    public StaffManager(IStaffRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<StaffDto>> GetAllStaffAsync(string? searchKeyword, StaffStatus? status)
    {
        var staffList = await _repository.GetAllAsync(searchKeyword, status);
        return staffList.Select(s => new StaffDto
        {
            Id = s.Id,
            FullName = s.FullName,
            Email = s.Email,
            Phone = s.Phone,
            Position = s.Position,
            Status = s.Status,
            CreatedAt = s.CreatedAt
        });
    }

    public async Task<StaffDto?> GetStaffByIdAsync(Guid id)
    {
        var s = await _repository.GetByIdAsync(id);
        if (s == null) return null;

        return new StaffDto
        {
            Id = s.Id,
            FullName = s.FullName,
            Email = s.Email,
            Phone = s.Phone,
            Position = s.Position,
            Status = s.Status,
            CreatedAt = s.CreatedAt
        };
    }

    public async Task<StaffDto> CreateStaffAsync(CreateStaffDto dto)
    {
        var entity = new StaffMember
        {
            Id = Guid.NewGuid(),
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            Position = dto.Position,
            Status = StaffStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(entity);

        return new StaffDto
        {
            Id = entity.Id,
            FullName = entity.FullName,
            Email = entity.Email,
            Phone = entity.Phone,
            Position = entity.Position,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt
        };
    }

    public async Task<bool> UpdateStaffAsync(Guid id, UpdateStaffDto dto)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing == null) return false;

        existing.FullName = dto.FullName;
        existing.Email = dto.Email;
        existing.Phone = dto.Phone;
        existing.Position = dto.Position;
        existing.Status = dto.Status;

        await _repository.UpdateAsync(existing);
        return true;
    }

    public async Task<bool> DeleteStaffAsync(Guid id)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing == null) return false;

        await _repository.DeleteAsync(id);
        return true;
    }
}
