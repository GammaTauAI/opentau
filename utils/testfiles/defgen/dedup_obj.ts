// dedup test
function k(obj) {
  console.log(obj.j);
  console.log(obj.j);
  console.log(obj.j.k);
  console.log(obj.j.k);
  console.log(obj.j.k.l);
  console.log(obj.j.k.f.e);
  console.log(obj.j.g.f.e);
}
