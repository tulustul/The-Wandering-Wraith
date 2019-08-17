// function ValueNoise(values) {
//   this.values = Array.isArray(values) ? values : this.generateValues();
//   this.smooth = this.interpolate;
// }
// ValueNoise.prototype = {
//   generateValues: function() {
//     var result = [];
//     for (var i = 0; i < 1234; i++) {
//       result.push(Math.random() * 2 - 1); //Output is between -1.. 1
//     }
//     return result;
//   },
//   smoothstep: function(a, b, f) {
//     var f = f * f * (3 - 2 * f);
//     return a + f * (b - a);
//   },
//   interpolate: function(a, b, f) {
//     var f = 0.5 - Math.cos(f * Math.PI) * 0.5;
//     return a + f * (b - a);
//   },
//   getValue: function(x) {
//     let max = this.values.length,
//       ix = Math.floor(x),
//       fx = x - ix, // "gradient"
//       i1 = ((ix % max) + max) % max,
//       i2 = (i1 + 1) % max;
//     return this.smooth(this.values[i1], this.values[i2], fx);
//   },
//   getValueOctaves: function(x, octaves) {
//     if (octaves < 2) {
//       return this.getValue(x);
//     }
//     let result = 0,
//       m,
//       io,
//       c,
//       maxo = 1 << octaves,
//       fract = 1 / (maxo - 1);
//     for (var i = 1; i <= octaves; i++) {
//       io = i - 1;
//       m = fract * (1 << (octaves - i));
//       result += this.getValue(x * (1 << io) + io * 0.1234) * m;
//     }
//     return result;
//   },
// };
