/*
  GLOBALS
*/
let board;
let player;
let bottleFactory = new BottleFactory();
let monsterFactory = new MonsterFactory();

// ENUMS
const bottleTypes = {
  POTION: 'potion',
  POISON: 'poison',
  ELIXIR: 'elixir'
};
const monsterTypes = {
  SLIME: 'slime',
  GOLEM: 'golem',
  FAE: 'fae',
  DEMON: 'demon',
  MIMIC: 'mimic'
};

$(document).ready(function() {
  console.log('⚔ Hello World! ⚔');

  board = new Board();
  player = new Player('Raz', 150);
});

function action(e){
  var keynum;

  if(window.event) { // IE                  
    keynum = e.keyCode;
  } else if(e.which){ // Netscape/Firefox/Opera                 
    keynum = e.which;
  }

  //48-57; 0-9; inventory items
  let useInvItem = {
    48: 0,
    49: 1,
    50: 2, 
    51: 3, 
    52: 4, 
    53: 5, 
    54: 6, 
    55: 7, 
    56: 8, 
    57: 9
  }; 

  let arrowDirections = {
    37: 'LEFT', 
    38: 'UP', 
    39: 'RIGHT', 
    40: 'DOWN'
  }

  if(arrowDirections[keynum]){
    player.move(arrowDirections[keynum]);
  } else if(useInvItem[keynum]){
    player.useInvItem(useInvItem[keynum]);
  }

  //TODO: trigger other/enemy movements on the board
}

class Board{
  constructor(){
    console.log('creating board...');
    this.boardElement = document.getElementsByClassName('board')[0];

    this.minBoardSize = 25;
    this.maxBoardSize = 25;

    //TODO: pull out the random number generator?
    this.boardSize = Math.floor(Math.random() * (this.maxBoardSize - this.minBoardSize + 1)) + this.minBoardSize;
    
    // actual board
    this.gameboard = Array.from(Array(this.boardSize), () => new Array(this.boardSize).fill(null));

    /* CREATE BOARD UI */
    for(let i = 0; i < this.boardSize; ++i){
      let newRow = document.createElement('div');
      newRow.className = 'row';
      this.boardElement.appendChild(newRow);
      for(let j = 0; j < this.boardSize; ++j){
        let newElement = document.createElement('div');
        newElement.className = 'unit';
        newElement.id = `${i}-${j}`;
        newRow.appendChild(newElement);
      }
    }

    this.createBottles();
    
    //(current) TODO: create and design monsters and battle system
    this.createMonsters();
  }

  getLocationByCoord(coord){
    return document.getElementById(coord);
  }
  
  checkOutOfBounds(newPos){
    if(this.getLocationByCoord(newPos)){
      return true;
    } else {
      return false;
    }
  }

  getRandomFreeSpaceCoord(){
    //TODO: why am i just returning the coords? would it make more sense to return the space itself?
    let randomCoords;

    while(this.areObjectsHere(randomCoords) !== true){
      randomCoords = `${Math.floor(Math.random() * this.boardSize)}-${Math.floor(Math.random() * this.boardSize)}`;
    }

    return randomCoords;
  }

  areObjectsHere(coord){
    // TODO: whole function seems redundant; try to merge into peekObjectAt
    let objects = this.getObjectsinSpace(coord);
    
    if(objects === null){
      return undefined;
    }

    return objects.length === 0;
  }

  peekObjectAt(coord){
    // return object at position
    let coordSplit = coord.split('-');
    let object = this.gameboard[coordSplit[0]][coordSplit[1]];

    return object;
  }

  grabObjectAt(coord){
    // remove and return object at position
    let coordSplit = coord.split('-');
    let object = this.gameboard[coordSplit[0]][coordSplit[1]];
    this.gameboard[coordSplit[0]][coordSplit[1]] = null;

    this.getLocationByCoord(coord).classList.toggle(object.type);
    
    return object;
  }

  getObjectsinSpace(coord){
    let space = this.getLocationByCoord(coord);
    
    if(space === null){ //space doesn't exist
      return null;
    }
    let ignoredClasses = ['unit', 'player']; // TODO: should set as variables
    return space.className.split(' ').filter(currClass => !ignoredClasses.includes(currClass));
  }

  createBottles(){
    //todo: this function is similar to createMonsters

    /* PLACE THREE BOTTLES OF EACH TYPE ON THE FIELD */
    console.log('creating bottles...');
    let bottleCount = 3;
    
    Object.values(bottleTypes).forEach(type => {
      for(let i=0; i < bottleCount; ++i){
        let coords = this.getRandomFreeSpaceCoord();
        let coordsSplit = coords.split('-');

        //actual board
        this.gameboard[coordsSplit[0]][coordsSplit[1]] = bottleFactory.createBottle(type);
        //UI board
        this.getLocationByCoord(coords).classList.add(type);
      }
    });
  }

  createMonsters(){
    //create and place one monster of each type
    console.log('creating monsters...');
    let monsterCount = 1;
  
    Object.values(monsterTypes).forEach(type => {
      for(let i=0; i < monsterCount; ++i){
        let coords = this.getRandomFreeSpaceCoord();
        let coordsSplit = coords.split('-');

        //actual board:
        this.gameboard[coordsSplit[0]][coordsSplit[1]] = monsterFactory.createMonster(type);
        //UI board
        this.getLocationByCoord(coords).classList.add(type);
      }
    });
  }
}

class Player{
  constructor(name, maxHealth){
    console.log('creating player...');

    this.name = name;

    this.HPMax = maxHealth;
    this.HPCurrent = maxHealth;

    this.STR = 10;
    this.SPD = 1;
    
    this.inventory = [];

    this.currentAction = '';
    this.currentLocation = board.getRandomFreeSpaceCoord();

    this.toggleToken();
    document.getElementsByClassName('player-name')[0].textContent = this.name;
    this.changeHealth(0);
    this.setAction('You enter the dungeon. Your health is full.');
  }

  toggleToken(){
    board.getLocationByCoord(`${this.currentLocation}`).classList.toggle('player')
  }

  changeHealth(amount){
    // TODO: when health <= 0, game over
    this.HPCurrent = this.HPCurrent + Number(amount);
    document.getElementsByClassName('player-health')[0].textContent = `${this.HPCurrent}/${this.HPMax}`;
  }
  
  move(direction){
    /* MOVEMENT */
    let currPosCoord = this.currentLocation.split('-');
    let newPos;

    // TODO: which is more efficient: case statement or if ladder
    if(direction === 'LEFT'){ //left
      newPos = `${currPosCoord[0]}-${Number(currPosCoord[1])-1}`;
    }
    if(direction === 'UP'){ //up
      newPos = `${Number(currPosCoord[0])-1}-${currPosCoord[1]}`;
    }
    if(direction === 'RIGHT'){ //right
      newPos = `${currPosCoord[0]}-${Number(currPosCoord[1])+1}`;
    }
    if(direction === 'DOWN'){ //down
      newPos = `${Number(currPosCoord[0])+1}-${currPosCoord[1]}`;
    }

    if(board.checkOutOfBounds(newPos)){
      if(board.areObjectsHere(newPos)){
        this.onward(newPos);
        this.changeHealth(-1);
        this.setAction("You press on...")
      } else {
        let newItem = board.peekObjectAt(newPos);

        if(Monster.prototype.isPrototypeOf(newItem)){
          this.attackMonster(newPos);
        } else if(Bottle.prototype.isPrototypeOf(newItem)) {
          this.pickUpItems(newPos);
        }
      }
    } else {
      this.setAction("You've reached the end of the world as you know it.");
    }
  }

  onward(newPos){
    this.toggleToken(); //remove token
    this.currentLocation = newPos;
    this.toggleToken(); //place token
  }

  pickUpItems(newPos){
    let newItem = board.grabObjectAt(newPos);
    this.inventory.push(newItem);

    //TODO: seperate out in different place?
    let inventory = document.getElementsByClassName('player-items')[0];
    let newInvItemElement = document.createElement('li');
    newInvItemElement.className = `inv-item ${newItem.type}`;
    newInvItemElement.textContent = `${newItem.name}`;
    inventory.appendChild(newInvItemElement);

    this.onward(newPos);
    this.setAction(`You pick up the ${newItem.name}.`);
  }

  setAction(action){
    this.currentAction = action;
    document.getElementsByClassName('player-action')[0].textContent = this.currentAction;
  }

  useInvItem(itemNum){
    let itemIndex = itemNum-1;
    if(this.inventory[itemIndex]){
      document.getElementById(`player-items`).children[itemIndex].remove();
      let bottle = this.inventory.splice(itemIndex, 1)[0].use();
      this.setAction(bottle.action);
      this.changeHealth(bottle.HPEffect);
    } else {
      this.setAction('You reach for a bottle that isn\'t there...');
    }
  }

  attackMonster(monsterLoc){
    //TODO: monsters have different types of attacks and behaviors
    let monster = board.peekObjectAt(monsterLoc);
    let damage = -this.STR;
    monster.changeHealth(damage);
    monster.attack();

    console.log(`${this.name}: ${this.HPCurrent}`);
    console.log(`${monster.name}: ${monster.HPCurrent}`);
    this.setAction(`You attack the ${monster.name}! You deal ${-damage} damage.`);
  }
}

/* BOTTLE FACTORY and BOTTLES*/ 

class BottleFactory {
  constructor() {
    this.createBottle = function (type) {
      var bottle;

      if (type === bottleTypes.POTION) {
        bottle = new Potion();
      } else if (type === bottleTypes.POISON) {
        bottle = new Poison();
      } else if (type === bottleTypes.ELIXIR) {
        bottle = new Elixir();
      }

      bottle.type = type;

      return bottle;
    };
  }
}

class Bottle {
  constructor(){
    this.name;
    this.HPEffect = this.randomHealth();
    this.type;
    this.addtlActionText = '';
  }

  randomHealth(){
    let minHealth = 12;
    let maxHealth = 120;
    return Math.floor(Math.random() * (maxHealth - minHealth + 1)) + minHealth;
  }

  use(){
    return {
      name: this.name,
      HPEffect: this.HPEffect,
      action: `You drink the ${this.type}. ` + this.addtlActionText
    }
  }
}

class Potion extends Bottle {
  constructor(){
    super();
    this.name = 'Health Potion';
    this.addtlActionText = `You gain ${this.HPEffect} health!`;
    /*
    TODO: 
    Pick Random:
      - +(HPEffect/rand) each step for rand steps
      - +HPEffect now
    */
  }
}

class Poison extends Bottle {
  constructor(){
    super();
    this.name = 'Toxic Poison';
    this.HPEffect = -this.HPEffect;
    this.addtlActionText = `You lost ${this.HPEffect} health!`;

    /* 
    TODO: 
    Outside Combat:
      Player drinks potion; -HPEffect now
    In Combat:
      Apply poison to weapon; deal +(HPEffect/rand) each attack for rand attacks
      Throw poison at monster; deal (0 to HPEffect) dmg
    */
  }
}

class Elixir extends Bottle {
  constructor(){
    super();
    this.name = 'Elixir of Null';
    this.HPEffect = Math.floor(this.HPEffect/4);
    this.addtlActionText = `You gain ${this.HPEffect} health!`;

    /* 
    TODO: 
    Pick random:
    - +rand STR for rand steps
    - +rand SPD for rand steps
    - +Player.MaxHealth if Player.Health <= 0
    */
  }
}

/* MONSTERS/ENEMIES */
class MonsterFactory {
  constructor() {
    this.createMonster = function (type) {
      var monster;

      if (type === monsterTypes.FAE) {
        monster = new Fae();
      } else if (type === monsterTypes.GOLEM) {
        monster = new Golem();
      } else if (type === monsterTypes.DEMON) {
        monster = new Demon();
      } else if (type === monsterTypes.MIMIC) {
        monster = new Mimic();
      } else if (type === monsterTypes.SLIME) {
        monster = new Slime();
      }

      monster.type = type;

      return monster;
    };
  }
}

class Monster {
  constructor(){
    this.name = 'Vague Villain';
    this.type;
    this.HPMax = 100;
    this.HPCurrent = 100;
    this.STR = 1;
    this.SPD = 1;
    this.validMoves = ['attack', 'idle']

    // TODO: maybe only demons buff; fae and demons use magic
    this.spells = ['damage', 'heal', 'buff']; 
  }

  changeHealth(amount){
    // todo: what happens when hp <=0
    this.HPCurrent = this.HPCurrent + amount;
  }

  attack(){
    player.changeHealth(-this.STR);
  }
}

class Golem extends Monster {
  constructor(){
    super();
    this.name = 'Golem';
    //TODO: slow, tanky, heavy hitter
  }
}

class Demon extends Monster {
  constructor(){
    super();
    this.name = 'Demon';
    // TODO: penultimate boss fight; super strong and 6ft tall
  }
}

class Fae extends Monster {
  constructor(){
    super();
    this.name = 'Fae';
    // TODO: annoying to deal with; lots of dodge?
  }
}

class Mimic extends Monster {
  constructor(){
    super();
    this.name = 'Mimic';
    // TODO: drops a random bottle (elixir?)
  }
}

class Slime extends Monster {
  constructor(){
    super();
    this.name = 'Slime';
    //TODO:  could slurp up an item during a successful attack
  }
}


/* MONSTER BEHAVIOR NOTES */

/*
Speed Levels:
-------------
0 - static: no movement
1 - very slow: 
2 - slow: 
3 - average: player normal; every keyboard interaction
4 - above average: 
5 - quick: 
6 - demonic:

Attack Pattern Types: 
---------------
0 pacifist, attacks 10% of the time
1 sluggish (will choose not to attack occasionally)
2 self-defense, attacks after a "heavy" attack, or only when attacked
3 steady, predictable (quarter notes)
4 focused (primarily uses light attacks, but may double up with a heavy attack)
5 ???
6 relentless assault (always heavy attack if able)
*/