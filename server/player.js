var classes = require('./classes/classes');
var east = 0;
var south = 1;
var west = 2;
var north = 3;
var allPlayer = {}

var determineFace = function(y, x){
  if (x > 0) {
    return east;
  } else if (x < 0) {
    return west;
  } else if (y > 0) {
    return south;
  } else if (y < 0) {
    return north;
  }
}

module.exports = {
  createPlayer: function(name,race, cid, m, pos, skt){
    var p = {};

    // player meta data and other object
    p.map = m;
    p.clientId = cid;
    p.face = east;
    allPlayer[cid] = p;
    p.socket = skt;
    p.name = name;
    p.race = race;


    // player status info
    p.position = pos;

    // player method
    p.initStatus = function() {
      p.maxHP = 100;
      p.exp = 20;
      p.level = 1;
      p.expNextLevel = 50;
      p.HP = p.maxHP;
      p.attackPoint = 20;
      p.defencePoint =20;
      p.regenHP = 0;
      p.dodge = 0;
      p.critAtt = 0;
      classes.createSoldier(p);
    }
    p.initStatus();

    p.notify = function() {
      var mapInfo = p.map.getSight(p.position);
      mapInfo.user = {
        face: p.face,
        HP: p.HP,
        maxHP: p.maxHP,
        att: p.attackPoint,
        def: p.defencePoint,
        dog: p.dodge,
        cri: p.critAtt,
        class: p.class.name,
        level: p.level,
        name: p.name,
        race: p.race,
        exp: p.exp,
        nextLevel: p.expNextLevel,
        numUsers: p.map.onlineUser
      };
      if (p.level >= 5 && p.class.tier == 0){
        mapInfo.upgradeClass = p.class.upgrade;
      }
      p.socket.emit('event', mapInfo);
    };

    p.move = function (x, y) {
      var newPos = [p.position[0] + x, p.position[1] + y];
      var oldFace = p.face;
      p.face = determineFace(x, y);
      if (p.map.available(newPos, p)){
        p.map.removeObject(p.position, p);
        p.position = newPos;
        p.map.addObject(newPos, 'player', p);
      } else if (oldFace != p.face) {
        p.notify();
      }
    };

    p.isDead = function() {
      return p.HP < 0;
    };

    p.addExp = function (expGain) {
      p.exp += expGain;
      while(p.exp >= p.expNextLevel){
        p.levelUp();
        p.level ++;
        p.exp -= p.expNextLevel;
        p.expNextLevel = p.level * (p.level - 1) * 50;
      }
    }

    p.restart = function() {
      p.socket.emit('id', p.socket.id)
      p.socket.emit('map', p.map.map);
      var spawnPoint = p.map.generateSpawnPoint();
      p.position = spawnPoint;
      p.initStatus();
      p.notify();
    }

    p.attacked = function(attacker) {
      var dodgeRoll = Math.random() * 100;
      var critRoll = Math.random() * 100;
      if (dodgeRoll > p.dodge) {
        var factor = 1;
        if (critRoll < attacker.critAtt) {
          factor = 2;
        }
        p.HP -= factor * attacker.attackPoint * 100 / (100 + p.defencePoint);
        if (p.isDead()) {
          attacker.addExp(p.expNextLevel * 4 / 5);
          p.delete();
        }
      }
    }

    p.getInfo = function() {
      return {
        face: p.face,
        HP: p.HP,
        maxHP: p.maxHP,
        name: p.name,
        race: p.race
      }
    };

    p.delete = function() {
      var cid = p.clientId;
      allPlayer[cid].map.removeObject(allPlayer[cid].position);
      //delete allPlayer[cid];
      p.socket.emit('message', 'dead');
    };

    p.map.addObject(pos, 'player', p);
    return p;
  },

  deletePlayer: function(cid) {
    if(allPlayer[cid]) allPlayer[cid].map.removeObject(allPlayer[cid].position);
    delete allPlayer[cid];
  },

  getPlayer : function(cid) {
    return allPlayer[cid]
  }


}
