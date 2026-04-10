using System.Security.Cryptography;

namespace Lynx.Api.Services;

public static class ShortCodeGenerator
{
    private const string Alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    public static string Generate(int length = 8)
    {
        var bytes = RandomNumberGenerator.GetBytes(length);
        var chars = new char[length];

        for (int i = 0; i < length; i++)
            chars[i] = Alphabet[bytes[i] % Alphabet.Length];

        return new string(chars);
    }
}