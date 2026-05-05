using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Payment.Application.DTOs;
using Payment.Application.Interfaces;

namespace Payment.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    // 1. Process payment (Create transaction, return mock QR/URL)
    [HttpPost("process")]
    public async Task<IActionResult> ProcessPayment([FromBody] PaymentRequestDto request)
    {
        var response = await _paymentService.ProcessPaymentAsync(request);
        return Ok(response);
    }

    // 2. Confirm payment (Usually called via webhook from Payment Gateway)
    [HttpPost("confirm/{paymentId}")]
    public async Task<IActionResult> ConfirmPayment(Guid paymentId)
    {
        var success = await _paymentService.ConfirmPaymentAsync(paymentId);
        if (!success)
        {
            return BadRequest(new { Message = "Payment not found or already processed." });
        }
        
        return Ok(new { Message = "Payment confirmed successfully." });
    }

    // 3. API simulate payment success (For testing/mock purposes)
    [HttpPost("simulate/{paymentId}")]
    public async Task<IActionResult> SimulateSuccessfulPayment(Guid paymentId)
    {
        // For testing, we just redirect/call the confirm endpoint internally.
        var success = await _paymentService.ConfirmPaymentAsync(paymentId);
        if (!success)
        {
            return BadRequest(new { Message = "Simulation failed. Payment not found or already processed." });
        }
        
        return Ok(new { Message = "Simulation successful. Payment confirmed." });
    }
}
