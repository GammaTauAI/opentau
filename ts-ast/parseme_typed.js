function hello(name1, name2) {
    function inner() {
        var myStuff = "Hello, ";
        return myStuff;
    }
    return inner() + name1 + ", " + inner() + name2;
}
console.log(hello("John", "Smith"));
