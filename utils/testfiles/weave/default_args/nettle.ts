export class Vector {
    constructor(public components: number[] = [0, 0, 0, 1]) { }
    toArray(Constructor: ArrayConstructor = Array): Array<number> {
        return new Constructor(this.components);
    }
    toString(): string {
        return `(${this.components.join(",")})`;
    }
}
