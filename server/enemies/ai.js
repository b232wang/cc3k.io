module.exports = {
  basicAction: function(enemy, floor, objects, io) {
    // this is for simple melee enemy, attack range: 1
    var x = enemy.location[0];
    var y = enemy.location[1];
    var playerInRange = []
    // playerInRange is [player, location] where location is [x, y]
    for (var i = x - 1; i <= x + 1; i++) {
      for (var j = y - 1; j <= y + 1; j++) {
        if(objects[i][j] && objects[i][j].type == 'player'){
          playerInRange.push([objects[i][j].object, [i, j]]);
        }
      }
    }
    if (playerInRange.length > 0) {
      // attack player
      var index = Math.floor(Math.random() * playerInRange.length);
      var attackedPlayer = playerInRange[index][0].attacked(enemy);
      io.emit('effect' , {type: 'attack', duration: 5, location: playerInRange[index][1]});
    } else {
      // cannot attack anyone, search for near enemy
      for (var i = x - 5; i <= x + 5; i++) {
        for (var j = y - 5; j <= y + 5; j++) {
          if(objects[i][j] && objects[i][j].type == 'player'){
            playerInRange.push([objects[i][j].object, [i, j]]);
          }
        }
      }
      if (playerInRange.length > 0) {
        var index = Math.floor(Math.random() * playerInRange.length);
        var target = playerInRange[index][0];
        var targetPosition = playerInRange[index][1];
        var oldx = x;
        var oldy = y;
        if (x > targetPosition[0] && !objects[x - 1][y]){
          x--;
        } else if (x < targetPosition[0] && !objects[x + 1][y]){
          x++;
        } else if (y > targetPosition[1]  && !objects[x][y - 1]){
          y--;
        } else if (y < targetPosition[1]  && !objects[x][y + 1]){
          y++;
        }
        if(floor[x][y] == '.' && !objects[x][y]){
          objects[oldx][oldy] = null;
          enemy.location = [x, y];
          objects[x][y] = {
            type: 'enemy',
            object: enemy
          };
        }
      } else {
        //just random move
        var rand = Math.floor(Math.random() * 4);
        var oldx = x;
        var oldy = y;
        switch (rand) {
          case 0:
            x++;
            break;
          case 1:
            x--;
            break;
          case 2:
            y++;
            break;
          case 3:
            y--;
            break;
        }
        if(floor[x][y] == '.' && !objects[x][y]){
          objects[oldx][oldy] = null;
          enemy.location = [x, y];
          objects[x][y] = {
            type: 'enemy',
            object: enemy
          };
        }
      }
    }
  }
}