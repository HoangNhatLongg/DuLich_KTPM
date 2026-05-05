# AI Context – Travel Company Management System

## 1. Overview

This system is a **microservices-based travel management platform** built with:

* ASP.NET Core (.NET 8)
* PostgreSQL
* RabbitMQ
* Docker

Architecture style:

* Microservices
* Clean Architecture
* Event-driven communication

---

## 2. System Architecture

### Core Components

* API Gateway
* Microservices (independent)
* Message Broker (RabbitMQ)
* Database per service

### Communication

* Synchronous: REST API
* Asynchronous: RabbitMQ (event-driven)

---

## 3. Services

### 3.1 User Service

Responsibilities:

* Authentication (JWT)
* Authorization (Role-based)
* User management

Roles:

* Admin
* Staff
* Customer

---

### 3.2 Tour Service

Responsibilities:

* Manage tours (Admin)
* Provide tour data (User)

Entities:

* Tour
* Itinerary

Business Rules:

* Only "Published" tours are visible to users
* Tours must have available slots to be booked

---

### 3.3 Booking Service

Responsibilities:

* Handle tour booking
* Check availability from TourService
* Manage booking status

States:

* Pending
* Paid
* Cancelled

Events:

* BookingCreated
* BookingUpdated

---

### 3.4 Payment Service

Responsibilities:

* Process payments
* Confirm transactions

Events:

* PaymentCompleted

---

### 3.5 Notification Service

Responsibilities:

* Consume events from RabbitMQ
* Send notifications (email/log)

Subscribed Events:

* BookingCreated
* PaymentCompleted

---

### 3.6 Staff Service

Responsibilities:

* Manage staff data

---

### 3.7 Report Service

Responsibilities:

* Revenue reports
* Statistics

---

## 4. Project Structure

Each service follows Clean Architecture:

* API → Controllers, Middleware
* Application → Business logic, DTOs
* Domain → Entities, Interfaces
* Infrastructure → Database, External services

Dependency rules:

* API depends on Application & Infrastructure
* Application depends on Domain
* Infrastructure depends on Domain
* Domain has no dependencies

---

## 5. Shared Library (BuildingBlocks)

Contains:

* BaseEntity
* Common response models
* Event interfaces
* Event bus abstraction
* Exception handling
* Logging utilities

---

## 6. Database Design

* Each service has its own PostgreSQL database
* No shared database between services

Examples:

* UserDB
* TourDB
* BookingDB
* PaymentDB

---

## 7. Event-Driven Design

Message Broker: RabbitMQ

### Event Flow Example:

1. Booking created → BookingService publishes "BookingCreated"
2. Payment processed → PaymentService publishes "PaymentCompleted"
3. BookingService updates status
4. NotificationService sends confirmation

---

## 8. API Gateway

Responsibilities:

* Routing
* Authentication (JWT validation)
* Rate limiting

Technology:

* YARP or Ocelot

---

## 9. Security

* JWT Authentication
* Role-based Authorization (RBAC)
* Input validation
* Prevent SQL Injection (use ORM)

---

## 10. Coding Guidelines

### General Rules

* Follow Clean Architecture strictly
* Do not place business logic in Controllers
* Use DTOs for API communication
* Use async/await for all IO operations

### Naming

* Services: PascalCase (UserService, TourService)
* Methods: PascalCase
* Variables: camelCase

---

## 11. Integration Rules

* Services must not access other service databases directly
* Use REST or events only
* Avoid tight coupling

---

## 12. Error Handling

* Global exception middleware
* Standard response format:

  * success
  * message
  * data

---

## 13. Docker & Deployment

* Each service has its own Dockerfile
* Use docker-compose for orchestration

---

## 14. Future Extensions

Possible services:

* Review Service
* Recommendation Service
* Pricing Engine

---

## 15. AI Usage Instructions

When generating code:

* Always follow Clean Architecture
* Never mix layers
* Always separate Domain, Application, Infrastructure
* Use PostgreSQL + EF Core
* Use RabbitMQ for async communication
* Ensure services are independent

Do NOT:

* Use a shared database
* Put business logic in controllers
* Skip validation
* Create tightly coupled services

---

## 16. Key Principles

* Scalability
* Maintainability
* Loose coupling
* High cohesion
* Fault tolerance

---
