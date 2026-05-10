using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Payment.Application.DTOs;
using Payment.Application.Interfaces;
using Payment.API.Models;

namespace Payment.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    // 1. Process payment (Create transaction, return mock QR/URL)
    [HttpPost("process")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ProcessPayment([FromBody] PaymentRequestDto request)
    {
        var response = await _paymentService.ProcessPaymentAsync(request);
        return Ok(ApiResponse<object>.Ok(response, "Payment processed successfully."));
    }

    // 2. Confirm payment (Usually called via webhook from Payment Gateway)
    [HttpPost("confirm/{paymentId}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConfirmPayment(Guid paymentId)
    {
        var success = await _paymentService.ConfirmPaymentAsync(paymentId);
        if (!success)
        {
            return BadRequest(ApiResponse<object>.Fail("Payment not found or already processed."));
        }

        return Ok(ApiResponse<object>.Ok(null, "Payment confirmed successfully."));
    }

    // 3. API simulate payment success (For testing/mock purposes)
    [HttpPost("simulate/{paymentId}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SimulateSuccessfulPayment(Guid paymentId)
    {
        var success = await _paymentService.ConfirmPaymentAsync(paymentId);
        if (!success)
        {
            return BadRequest(ApiResponse<object>.Fail("Simulation failed. Payment not found or already processed."));
        }

        return Ok(ApiResponse<object>.Ok(null, "Simulation successful. Payment confirmed."));
    }
}
