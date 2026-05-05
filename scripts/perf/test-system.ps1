param(
    [ValidateSet("register", "login", "tours", "booking", "payment", "e2e", "all")]
    [string]$Mode = "all",
    [string]$UserBaseUrl = "http://localhost:5001",
    [string]$TourBaseUrl = "http://localhost:5002",
    [string]$BookingBaseUrl = "http://localhost:5003",
    [string]$PaymentBaseUrl = "http://localhost:5004",
    [string]$GatewayBaseUrl = "http://localhost:5000",
    [int]$Count = 5,
    [string]$Password = "Admin@123",
    [string]$Role = "Customer",
    [decimal]$PaymentAmount = 500000,
    [int]$PaymentMethod = 1,
    [int]$PollSeconds = 20,
    [switch]$UseGatewayForTours,
    [switch]$UseGatewayForBookings
)

$ErrorActionPreference = "Stop"

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "=== $Title ===" -ForegroundColor Cyan
}

function New-TestUser {
    param([int]$Index)

    $stamp = Get-Date -Format "yyyyMMddHHmmss"
    return [pscustomobject]@{
        email = "load-$stamp-$Index@example.com"
        password = $Password
        role = $Role
    }
}

function Invoke-TimedJsonRequest {
    param(
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )

    $jsonBody = $null
    if ($null -ne $Body) {
        $jsonBody = $Body | ConvertTo-Json -Depth 8
    }

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $response = if ($null -ne $jsonBody) {
            Invoke-RestMethod -Method $Method -Uri $Uri -ContentType "application/json" -Body $jsonBody -Headers $Headers
        } else {
            Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers
        }

        $stopwatch.Stop()
        return [pscustomobject]@{
            Success = $true
            StatusCode = 200
            DurationMs = [math]::Round($stopwatch.Elapsed.TotalMilliseconds, 2)
            Data = $response
            Error = $null
        }
    }
    catch {
        $stopwatch.Stop()

        $statusCode = $null
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }

        return [pscustomobject]@{
            Success = $false
            StatusCode = $statusCode
            DurationMs = [math]::Round($stopwatch.Elapsed.TotalMilliseconds, 2)
            Data = $null
            Error = $_.Exception.Message
        }
    }
}

function Get-Stats {
    param([object[]]$Results)

    if (-not $Results -or $Results.Count -eq 0) {
        return [pscustomobject]@{
            Total = 0
            Success = 0
            Failed = 0
            AvgMs = 0
            MinMs = 0
            MaxMs = 0
        }
    }

    $durations = $Results | ForEach-Object { $_.DurationMs }
    $success = ($Results | Where-Object { $_.Success }).Count
    $failed = $Results.Count - $success

    return [pscustomobject]@{
        Total = $Results.Count
        Success = $success
        Failed = $failed
        AvgMs = [math]::Round(($durations | Measure-Object -Average).Average, 2)
        MinMs = [math]::Round(($durations | Measure-Object -Minimum).Minimum, 2)
        MaxMs = [math]::Round(($durations | Measure-Object -Maximum).Maximum, 2)
    }
}

function Show-Stats {
    param(
        [string]$Name,
        [object[]]$Results
    )

    $stats = Get-Stats -Results $Results
    Write-Host "$Name -> Total=$($stats.Total) Success=$($stats.Success) Failed=$($stats.Failed) Avg=$($stats.AvgMs)ms Min=$($stats.MinMs)ms Max=$($stats.MaxMs)ms"
}

function Show-FailedSamples {
    param(
        [string]$Name,
        [object[]]$Results,
        [int]$Limit = 3
    )

    $failed = $Results | Where-Object { -not $_.Success } | Select-Object -First $Limit
    if (-not $failed) {
        return
    }

    Write-Host "$Name failed samples:" -ForegroundColor Yellow
    foreach ($item in $failed) {
        $label = if ($item.PSObject.Properties["Email"]) { $item.Email } elseif ($item.PSObject.Properties["BookingId"]) { $item.BookingId } else { "n/a" }
        Write-Host "  Target=$label Status=$($item.StatusCode) Error=$($item.Error)"
    }
}

function Get-ToursEndpoint {
    if ($UseGatewayForTours) {
        return "$GatewayBaseUrl/api/tours"
    }

    return "$TourBaseUrl/api/tours"
}

function Get-BookingsBaseUrl {
    if ($UseGatewayForBookings) {
        return "$GatewayBaseUrl/api/bookings"
    }

    return "$BookingBaseUrl/api/bookings"
}

function Register-Users {
    param([int]$UserCount)

    $results = @()
    $users = @()

    for ($i = 1; $i -le $UserCount; $i++) {
        $user = New-TestUser -Index $i
        $users += $user

        $result = Invoke-TimedJsonRequest `
            -Method "POST" `
            -Uri "$UserBaseUrl/api/auth/register" `
            -Body $user

        $results += [pscustomobject]@{
            Email = $user.email
            DurationMs = $result.DurationMs
            Success = $result.Success
            StatusCode = $result.StatusCode
            Error = $result.Error
            Data = $result.Data
        }
    }

    return [pscustomobject]@{
        Users = $users
        Results = $results
    }
}

function Login-Users {
    param([object[]]$Users)

    $results = @()

    foreach ($user in $Users) {
        $result = Invoke-TimedJsonRequest `
            -Method "POST" `
            -Uri "$UserBaseUrl/api/auth/login" `
            -Body @{
                email = $user.email
                password = $user.password
            }

        $results += [pscustomobject]@{
            Email = $user.email
            DurationMs = $result.DurationMs
            Success = $result.Success
            StatusCode = $result.StatusCode
            Error = $result.Error
            Data = $result.Data
            AccessToken = if ($result.Success) { $result.Data.data.accessToken } else { $null }
            UserId = if ($result.Success) { $result.Data.data.user.id } else { $null }
        }
    }

    return $results
}

function Get-Tours {
    param([int]$Iterations)

    $endpoint = Get-ToursEndpoint
    $results = @()

    for ($i = 1; $i -le $Iterations; $i++) {
        $result = Invoke-TimedJsonRequest -Method "GET" -Uri $endpoint
        $results += $result
    }

    return $results
}

function Get-FirstTourId {
    $result = Invoke-TimedJsonRequest -Method "GET" -Uri (Get-ToursEndpoint)

    if (-not $result.Success) {
        throw "Cannot load tours. $($result.Error)"
    }

    $tourId = $result.Data.data[0].id
    if (-not $tourId) {
        throw "No tours found. Ensure TourService seeded data successfully."
    }

    return $tourId
}

function Create-Bookings {
    param(
        [object[]]$Logins,
        [string]$TourId
    )

    $results = @()
    $bookingsUrl = Get-BookingsBaseUrl

    foreach ($login in $Logins | Where-Object { $_.Success }) {
        $headers = @{}
        if ($UseGatewayForBookings -and $login.AccessToken) {
            $headers["Authorization"] = "Bearer $($login.AccessToken)"
        }

        $result = Invoke-TimedJsonRequest `
            -Method "POST" `
            -Uri $bookingsUrl `
            -Headers $headers `
            -Body @{
                userId = $login.UserId
                tourId = $TourId
            }

        $results += [pscustomobject]@{
            Email = $login.Email
            UserId = $login.UserId
            DurationMs = $result.DurationMs
            Success = $result.Success
            StatusCode = $result.StatusCode
            Error = $result.Error
            Data = $result.Data
            BookingId = if ($result.Success) { $result.Data.data.id } else { $null }
        }
    }

    return $results
}

function Process-Payments {
    param([object[]]$Bookings)

    $results = @()

    foreach ($booking in $Bookings | Where-Object { $_.Success -and $_.BookingId }) {
        $result = Invoke-TimedJsonRequest `
            -Method "POST" `
            -Uri "$PaymentBaseUrl/api/payments/process" `
            -Body @{
                bookingId = $booking.BookingId
                amount = $PaymentAmount
                method = $PaymentMethod
            }

        $results += [pscustomobject]@{
            BookingId = $booking.BookingId
            DurationMs = $result.DurationMs
            Success = $result.Success
            StatusCode = $result.StatusCode
            Error = $result.Error
            Data = $result.Data
            PaymentId = if ($result.Success) { $result.Data.paymentId } else { $null }
        }
    }

    return $results
}

function Wait-ForBookingPaid {
    param(
        [string]$BookingId,
        [int]$TimeoutSeconds
    )

    $bookingsUrl = Get-BookingsBaseUrl
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

    while ($stopwatch.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        $result = Invoke-TimedJsonRequest -Method "GET" -Uri "$bookingsUrl/$BookingId"
        if ($result.Success -and $result.Data.data.status -eq "Paid") {
            $stopwatch.Stop()
            return [pscustomobject]@{
                Success = $true
                DurationMs = [math]::Round($stopwatch.Elapsed.TotalMilliseconds, 2)
                Status = "Paid"
            }
        }

        Start-Sleep -Milliseconds 500
    }

    $stopwatch.Stop()
    return [pscustomobject]@{
        Success = $false
        DurationMs = [math]::Round($stopwatch.Elapsed.TotalMilliseconds, 2)
        Status = "Timeout"
    }
}

function Simulate-Payments {
    param([object[]]$Payments)

    $results = @()

    foreach ($payment in $Payments | Where-Object { $_.Success -and $_.PaymentId }) {
        $simulate = Invoke-TimedJsonRequest `
            -Method "POST" `
            -Uri "$PaymentBaseUrl/api/payments/simulate/$($payment.PaymentId)"

        $bookingCheck = Wait-ForBookingPaid -BookingId $payment.BookingId -TimeoutSeconds $PollSeconds

        $results += [pscustomobject]@{
            BookingId = $payment.BookingId
            PaymentId = $payment.PaymentId
            SimulateSuccess = $simulate.Success
            SimulateDurationMs = $simulate.DurationMs
            BookingPaid = $bookingCheck.Success
            BookingPaidAfterMs = $bookingCheck.DurationMs
            Error = $simulate.Error
        }
    }

    return $results
}

function Run-RegisterTest {
    Write-Section "Register Test"
    $register = Register-Users -UserCount $Count
    Show-Stats -Name "Register" -Results $register.Results
    Show-FailedSamples -Name "Register" -Results $register.Results
    return $register
}

function Run-LoginTest {
    Write-Section "Login Test"
    $register = Register-Users -UserCount $Count
    Show-Stats -Name "Register (setup)" -Results $register.Results
    Show-FailedSamples -Name "Register (setup)" -Results $register.Results
    $logins = Login-Users -Users $register.Users
    Show-Stats -Name "Login" -Results $logins
    Show-FailedSamples -Name "Login" -Results $logins
    return [pscustomobject]@{
        Register = $register
        Logins = $logins
    }
}

function Run-ToursTest {
    Write-Section "Tours Test"
    $results = Get-Tours -Iterations $Count
    Show-Stats -Name "Tours" -Results $results
    Show-FailedSamples -Name "Tours" -Results $results
    return $results
}

function Run-BookingTest {
    Write-Section "Booking Test"
    $register = Register-Users -UserCount $Count
    $logins = Login-Users -Users $register.Users
    $tourId = Get-FirstTourId
    Write-Host "Using tourId: $tourId"
    $bookings = Create-Bookings -Logins $logins -TourId $tourId
    Show-Stats -Name "Booking" -Results $bookings
    Show-FailedSamples -Name "Booking" -Results $bookings
    return [pscustomobject]@{
        Register = $register
        Logins = $logins
        TourId = $tourId
        Bookings = $bookings
    }
}

function Run-PaymentTest {
    Write-Section "Payment Test"
    $bookingRun = Run-BookingTest
    $payments = Process-Payments -Bookings $bookingRun.Bookings
    Show-Stats -Name "Payment Process" -Results $payments
    Show-FailedSamples -Name "Payment Process" -Results $payments
    return [pscustomobject]@{
        BookingRun = $bookingRun
        Payments = $payments
    }
}

function Run-E2ETest {
    Write-Section "End-to-End Test"
    $paymentRun = Run-PaymentTest
    $simulation = Simulate-Payments -Payments $paymentRun.Payments

    $simulateAsResults = $simulation | ForEach-Object {
        [pscustomobject]@{
            Success = $_.SimulateSuccess
            DurationMs = $_.SimulateDurationMs
        }
    }

    Show-Stats -Name "Payment Simulate" -Results $simulateAsResults

    $paid = ($simulation | Where-Object { $_.BookingPaid }).Count
    Write-Host "Booking updated to Paid: $paid/$($simulation.Count)"

    foreach ($item in $simulation) {
        Write-Host "Booking=$($item.BookingId) Payment=$($item.PaymentId) Paid=$($item.BookingPaid) EventDelay=$($item.BookingPaidAfterMs)ms"
    }

    return [pscustomobject]@{
        PaymentRun = $paymentRun
        Simulation = $simulation
    }
}

switch ($Mode) {
    "register" { Run-RegisterTest | Out-Null }
    "login" { Run-LoginTest | Out-Null }
    "tours" { Run-ToursTest | Out-Null }
    "booking" { Run-BookingTest | Out-Null }
    "payment" { Run-PaymentTest | Out-Null }
    "e2e" { Run-E2ETest | Out-Null }
    "all" {
        Run-RegisterTest | Out-Null
        Run-LoginTest | Out-Null
        Run-ToursTest | Out-Null
        Run-BookingTest | Out-Null
        Run-PaymentTest | Out-Null
        Run-E2ETest | Out-Null
    }
}
