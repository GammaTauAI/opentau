export class Vector {
    constructor(public components = [0, 0, 0, 1]) { }
    toArray(Constructor = Array) {
        return new Constructor(this.components);
    }
    toString() {
        return `(${this.components.join(",")})`;
    }
}
