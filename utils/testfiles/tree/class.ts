class Fraction {
  private numerator;
  private denominator;

  constructor(numerator, denominator) {
    this.numerator = numerator;
    this.denominator = denominator;
  }

  public getNumerator() {
    return this.numerator;
  }

  public getDenominator() {
    return this.denominator;
  }

  public add(fraction: Fraction) {
    const numerator =
      this.numerator * fraction.getDenominator() +
      fraction.getNumerator() * this.denominator;
    const denominator = this.denominator * fraction.getDenominator();
    return new Fraction(numerator, denominator);
  }

  public toString() {
    return this.numerator + "/" + this.denominator;
  }
}
