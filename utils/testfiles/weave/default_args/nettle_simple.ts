export class Vector {
    toArray(Constructor: ArrayConstructor = Array): Array<number> {
        return new Constructor(this.components);
    }
    toString(): string {
        return `(${this.components.join(",")})`;
    }
}
