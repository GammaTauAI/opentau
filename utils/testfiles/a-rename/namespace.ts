
namespace MyMath {
  export function calculateRectangle(width: number, length: number) {
    return width * length;
  }

  export class Rectangle {
    constructor(public width: number, public length: number) {}

    calculateArea() {
      return this.width * this.length;
    }

    addRectangle(rectangle: Rectangle) {
      return this.calculateArea() + rectangle.calculateArea();
    }
  }
}

const rectangle = new MyMath.Rectangle(5, 2);
console.log(rectangle.calculateArea());
console.log(MyMath.calculateRectangle(5, 2));
