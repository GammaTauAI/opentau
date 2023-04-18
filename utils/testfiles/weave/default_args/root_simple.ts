export class Vector {
    toArray(Constructor = Array) {
        return new Constructor(this.components);
    }
    toString() {
        return `(${this.components.join(",")})`;
    }
}
