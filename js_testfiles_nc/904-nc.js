function isPrime(n) {
    if (n <= 1) return false
    for (let i = 2; i < n; i++) if (n % i == 0) return false
  return true
}
const numPrimeArrangements = function(n) {
  let primes = 0   let result = 1
  const mod = 10 ** 9 + 7
  for (let i = 2; i <= n; i++) if (isPrime(i)) primes++
    for (let i = primes; i >= 1; i--) result = (i * result) % mod
  for (let i = n - primes; i >= 1; i--) result = (i * result) % mod
  return result }
