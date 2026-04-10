using Lynx.Api.Domain.Entities;
using Lynx.Api.DTOs.Retention;
using Lynx.Api.Infrastructure;
using Lynx.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Lynx.Api.Services;

public class RetentionService : IRetentionService
{
    private readonly AppDbContext _db;

    public RetentionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<RetentionJobDto> TriggerAsync(
        string tenantId,
        TriggerRetentionDto dto,
        CancellationToken ct)
    {
        var entity = new RetentionJob
        {
            TenantId = tenantId,
            JobType = dto.JobType,
            Status = "Pending",
            RecordsDeleted = 0,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = dto.Actor
        };

        _db.Add(entity);
        await _db.SaveChangesAsync(ct);

        return Map(entity);
    }

    public async Task<(IEnumerable<RetentionJobDto> data, int total)> 
        SearchAsync(string tenantId, RetentionSearchDto dto, CancellationToken ct)
    {
        var query = _db.Set<RetentionJob>()
            .Where(x => x.TenantId == tenantId)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(dto.Status))
            query = query.Where(x => x.Status == dto.Status);

        if (!string.IsNullOrWhiteSpace(dto.JobType))
            query = query.Where(x => x.JobType == dto.JobType);

        var total = await query.CountAsync(ct);

        var rows = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((dto.Page - 1) * dto.PageSize)
            .Take(dto.PageSize)
            .ToListAsync(ct);

        return (rows.Select(Map), total);
    }

    public async Task<RetentionJobDto?> GetByIdAsync(
        string tenantId,
        long id,
        CancellationToken ct)
    {
        var entity = await _db.Set<RetentionJob>()
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.TenantId == tenantId, ct);

        return entity == null ? null : Map(entity);
    }

    public async Task<bool> RetryAsync(
        string tenantId,
        long id,
        CancellationToken ct)
    {
        var entity = await _db.Set<RetentionJob>()
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.TenantId == tenantId, ct);

        if (entity == null) return false;

        if (entity.Status != "Failed")
            return false;

        entity.Status = "Pending";
        entity.ErrorMessage = null;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static RetentionJobDto Map(RetentionJob x)
        => new()
        {
            Id = x.Id,
            JobType = x.JobType,
            Status = x.Status,
            //RecordsDeleted = x.RecordsDeleted,
            //CreatedAtUtc = x.CreatedAtUtc,
            StartedAtUtc = x.StartedAtUtc,
            CompletedAtUtc = x.CompletedAtUtc,
            ErrorMessage = x.ErrorMessage
        };
}