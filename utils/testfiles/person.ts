function joe(p) {
  if (p.name === "Joe") {
    return p;
  } else {
    return new Person("Joe");
  }
}

const mike = (p) => {
  if (p.name === "Mike") {
    return p;
  } else {
    const person = new Person("Mike");
    return person;
  }
};

var steve = function (p) {
  if (p.name === "Steve") {
    return p;
  } else {
    var person = new Person("Steve");
    return person;
  }
};

class House {
  person;
  constructor(person) {
    this.person = person;
  }
}

class Person {
  name;
  house;
  make_house;
  constructor(name) {
    this.name = name;
    this.house = new House(this);
    this.make_house = (p) => {
      return new House(p);
    };
  }

  sayHello() {
    return "Hello " + this.name;
  }

  getHouse() {
    return this.house;
  }
}

console.log(joe(new Person("Joe")).sayHello());
console.log(mike(new Person("Mike")).sayHello());
console.log(steve(new Person("Steve")).sayHello());
console.log(new Person("Joe").make_house(new Person("Mike")).person.name);
console.log(new Person("Mike").make_house(new Person("Joe")).person.name);
console.log(new Person("Joe").getHouse().person.name);
