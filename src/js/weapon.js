 class Weapon {
     constructor(name, velocity, minDistance) {
         this.name = name;
         this.velocity = velocity;
         this.minDistance = minDistance;
     }

     getVelocity(distance) {
         var i;
         if (this.name === "Technical") {
             for (i = 1; i < TECHNICALS.length; i += 1) {
                 if (distance < TECHNICALS[i][0]) {
                     return TECHNICALS[i - 1][1] + ((distance - TECHNICALS[i - 1][0]) / (TECHNICALS[i][0] - TECHNICALS[i - 1][0])) * (TECHNICALS[i][1] - TECHNICALS[i - 1][1]);
                 }
             }
         }
         return this.velocity;
     }

 }