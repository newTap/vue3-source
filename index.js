let getX;

class C {
  #x = 1;
  static {
    getX = obj => obj.#x;
  }
}

console.log(getX(new C()))