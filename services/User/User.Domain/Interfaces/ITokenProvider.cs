using UserService.Domain.Entities;
using UserService.Domain.Models;

namespace UserService.Domain.Interfaces;

public interface ITokenProvider
{
    TokenResult GenerateTokens(User user);
}
