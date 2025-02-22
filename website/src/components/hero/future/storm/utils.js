export function _storm() {
  // https://codepen.io/ruigewaard/pen/Podmea

  var canvas = document.getElementById("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight / 2;

  if (canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var w = canvas.width;
    var h = canvas.height;

    ctx.strokeStyle = "rgba(174,194,224,0.5)";
    ctx.lineWidth = 2;
    ctx.lineCap = "square";

    var init = [];
    var maxParts = 200;
    for (var a = 0; a < maxParts; a++) {
      init.push({
        x: Math.random() * w,
        y: Math.random() * h,
        l: 5,
        xs: -4 + Math.random() * 4 + 2,
        ys: Math.random() * 10 + 10,
      });
    }

    var particles = [];
    for (var b = 0; b < maxParts; b++) {
      particles[b] = init[b];
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var c = 0; c < particles.length; c++) {
        var p = particles[c];
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.l * p.xs, p.y + p.l * p.ys);
        ctx.stroke();
      }
      move();
    }

    function move() {
      for (var b = 0; b < particles.length; b++) {
        var p = particles[b];
        p.x += p.ys;
        p.y += p.xs;
        if (p.x > w || p.y > h) {
          p.x = -20;
          p.y = Math.random() * w;
        }
      }
    }

    setInterval(draw, 30);
  }
}
