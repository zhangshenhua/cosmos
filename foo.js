

function findOdd(A) {
    //happy coding!
    var a = {};
    for (var x in A) {
      if (a[x]) {
        a[x] += 1;
      } else {
        a[x] = 1;
      }
    }
    for (var k in Object.keys(a)) {
      if (a[k] % 2 ) {
        return k;
      }
    }
  
  }


document.writeln('Hello, world!');

