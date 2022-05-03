// JavaScript source code
document.addEventListener("DOMContentLoaded", startSnake);

function startSnake(){
	var totalCells = 50;
	var domHandler = new DOMHandler(document,window);
	var context = domHandler.Context();
	var basicCell = domHandler.Cell(totalCells);
	var snake = new Snake(new Position(0,0), new Cell(basicCell.width , basicCell.height), '#FF0000');
	var fruitHandlerObj = new FruitHandler(new Cell(basicCell.width , basicCell.height), domHandler.CanvasCell);
	var score = snake.Score;

	context.registerElement(snake);
	context.registerElement(fruitHandlerObj);
	domHandler.onKeyDownLitsenerToDOM(changeSnakeDirection);
	domHandler.requestAnimationFrame(draw);

	function draw(){
		context.clearDrawings(domHandler.CanvasCell);
		context.updateDrawables();
		context.BeforeUpdate()
		context.updateElements();
		context.AfterUpdate();
		context.calculateCollisions();
		context.drawElements();
		if(score !== snake.Score){
			score = snake.Score;
			domHandler.UpdateScore(score);
		}
	}

	function changeSnakeDirection(event){
		var key = event.key;

		var direction = new Position(0,0);

		if(key === 'a' || key === 'A'){
			direction = new Position(-1,0);
		}

		if(key === 'd' || key === 'D'){
			direction = new Position(1,0);
		}

		if(key === 'w' || key === 'W'){
			direction = new Position(0,-1);
		}

		if(key === 's' || key === 'S'){
			direction = new Position(0,1);
		}

		snake.Direction(direction);
	}
}

class Context {
	#context2d;
	#elements;
	#registeredItems;
	#canvasCell;
	constructor(context2d, canvasCell){
		if(!context2d) throw new Error('cannot initialize Context');
		if((canvasCell instanceof Cell) === false) throw new Error('cannot initialize Context cause of cell reference');
		this.#context2d = context2d;
		this.#registeredItems = [];
		this.#canvasCell = canvasCell;
	}

	#hasDuplicates(arr){

		var stringArr = arr.map(function(el){
			return el.xAxis.toString() + el.yAxis.toString();
		});

		return stringArr.some(function(el,index){
			return stringArr.indexOf(el) !== index;
		})
	}

	calculateCollisions(){
		if(!this.#elements) return;
		var _this = this;
		this.#elements.forEach(function(element1){
			var pos1 = element1.Positions;	
			if(_this.#hasDuplicates(pos1)){
				element1.Collision2d(element1);
				return;
			}
			
			if(_this.#somePositionsPassedTheCanvasRange(pos1)){
				element1.Collision2d(null);
				return;
			}
			
			_this.#elements.forEach(function(element2){
				if(element1 === element2) return; 
				var pos2 = element2.Positions;
				if(_this.#hasDuplicates(pos2)){//has duplicates
					element2.Collision2d(element2);
					return;
				}
				
				if(_this.#somePositionsPassedTheCanvasRange(pos2)){
					element2.Collision2d(null);
					return;
				}

				var mergedPositions = [];

				pos1.forEach(function(pos){
					mergedPositions.push(pos);
				});

				pos2.forEach(function(pos){
					mergedPositions.push(pos);
				});
				//array find duplicates;

				if(_this.#hasDuplicates(mergedPositions))
					element1.Collision2d(element2);
			});
		});
	}
	
	#somePositionsPassedTheCanvasRange(positions){
		var _this = this;
		return positions.some(function(position){
			if(position.xAxis < 0 
				|| position.xAxis >= _this.#canvasCell.width
				|| position.yAxis < 0 
				|| position.yAxis >= _this.#canvasCell.height){
				return true;	
			}
			
			return false;
		});
	}

	updateElements(){
		if(!this.#elements) return;
		this.#elements.forEach(function(element){
			element.Update();
		})
	}

	drawElements(){
		if(!this.#elements) return;
		var _this = this;
		this.#elements.forEach(function(element){
			var cellRect = element.Cell;
			var style = element.Style;
			var positions = element.Positions;
			
			positions.forEach(function(position){
				_this.#context2d.beginPath();
				_this.#context2d.fillStyle = style;
				_this.#context2d.fillRect(position.xAxis, position.yAxis , cellRect.width, cellRect.height);
			})
		});
	}

	clearDrawings(canvasCell){
		if((canvasCell instanceof Cell) === false) throw new Error('canvasCell argument is not instance of Cell');
		this.#context2d.clearRect(0, 0, canvasCell.width, canvasCell.height);
	}

	updateDrawables(){
		if(this.#registeredItems.length === 0) return;

		this.#elements = this.#registeredItems;
		this.#registeredItems = [];
	}

	BeforeUpdate(){
		this.#elements.forEach(function(el){
			if(typeof el.BeforeUpdate === 'function')
				el.BeforeUpdate();
		});
	}

	AfterUpdate(){
		this.#elements.forEach(function(el){
			if(typeof el.AfterUpdate === 'function')
				el.AfterUpdate();
		});
	}

	registerElement(el){
		this.#registeredItems.push(el);
	}

	set #Elements(elements){
		this.#elements = elements;
	}
}
	
class DOMHandler{
	#canvas;
	#document;
	#window;
	#frameId;
	#FPS;
	constructor(document , window){
		if(!document) throw new Error('document reference is'+typeof document);
		if(!window) throw new Error('document reference is'+typeof window);
		this.#window = window;
		this.#document = document;
		this.#canvas = document.getElementById('snakeWindow');
		if(!this.#canvas) throw new Error('canvas could not found on dom');
		this.#frameId = 0;
		this.#FPS = 7;
	}
	
	UpdateScore(score){
		var scoreEl = document.getElementById('score');
		scoreEl.firstElementChild.innerText = score.toString();
	}

	Context(){
		return new Context(this.#canvas.getContext('2d'), this.CanvasCell);
	}
	
	Cell(totalCells){
		return new Cell(this.#canvas.width/totalCells, this.#canvas.height/totalCells);
	}

	get CanvasCell(){
		return new Cell(this.#canvas.width,this.#canvas.height);
	}

	get FPS(){
		return this.#FPS;
	}

	onKeyDownLitsenerToDOM(fn){
		if(typeof fn !== 'function') throw new Error('cannot add litsener cause argument is not type of function');
		this.#document.addEventListener('keydown',fn);
	}

	requestAnimationFrame(fn){
		if(typeof fn !== 'function') throw new Error('cannot request animation frame cause argument is not type of function');
		if(this.#frameId !== 0) return;
		return this.#frameId = setInterval(fn,1000 / this.#FPS);
	}

	cancelAnimationFrame(id){
		if((id && id === 0) || this.#frameId === 0) return;
		clearInterval(id || this.#frameId);
	}
}
	
class Snake{//snake has one cell and one style
	#headPosition;
	#cell;
	#style;
	#direction;
	#body;//array of positions
	#fruitsEatenTillGrow;
	#fruitsNeedToGrow;
	#score;
	#available;
	constructor(position, cell , style){
		if((position instanceof Position) === false) throw new Error('argument position is not instance of Position');
		if((cell instanceof Cell) === false) throw new Error('argument cell is not instance of Cell');
		if(typeof style !== 'string') throw new Error('argument style is not type of string');

		this.#headPosition = new Position(position.xAxis, position.yAxis);
		this.#cell = new Cell(cell.width , cell.height);
		this.#style = style;
		this.#direction = new Position(0,1);
		this.#body = [this.#headPosition];
		this.#fruitsEatenTillGrow = 0;
		this.#fruitsNeedToGrow = 1;
		this.#score = 0;
		this.#available = true;
	}

	Eat(fruit){
		if((fruit instanceof FruitHandler) === false) throw new Error('fruit is not the required instance');

		this.#fruitsEatenTillGrow = this.#fruitsEatenTillGrow + 1;

		if(this.#fruitsEatenTillGrow === this.#fruitsNeedToGrow){
			this.#fruitsEatenTillGrow = 0;
			var lastPosition = this.#body[this.#body.length - 1];
			var nextFromLastIndex = this.#body.indexOf(lastPosition);
			nextFromLastIndex = nextFromLastIndex === 0 ? nextFromLastIndex : nextFromLastIndex - 1;
			var nextFromLast = this.#body[nextFromLastIndex];
			
			var pos = null;

			if(nextFromLast === lastPosition){
				nextFromLast = this.#getNewPositionBasedOnDirection();
			}

			if(nextFromLast.xAxis < lastPosition.xAxis){//its on left
				 pos = new Position(lastPosition.xAxis + this.#cell.width, lastPosition.yAxis);
			}

			if(nextFromLast.xAxis > lastPosition.xAxis){//its on right
				 pos = new Position(lastPosition.xAxis - this.#cell.width, lastPosition.yAxis);
			}

			if(nextFromLast.yAxis < lastPosition.yAxis){//its above
				pos = new Position(lastPosition.xAxis, lastPosition.yAxis + this.#cell.height);
			}

			if(nextFromLast.yAxis > lastPosition.yAxis){//its under
				pos = new Position(lastPosition.xAxis, lastPosition.yAxis - this.#cell.height);
			}
			
			this.#body.push(new Position(pos.xAxis, pos.yAxis))
		}

		this.#score = this.#score + fruit.Score;
		fruit.RemoveFruitFromContext();
	}

	get Positions(){
		return this.#body;
	}

	#getNewPositionBasedOnDirection(){
		var xAxis = this.#headPosition.xAxis;
		var yAxis = this.#headPosition.yAxis;

		if(this.#direction.xAxis !== 0 && this.#direction.xAxis > 0){
			xAxis = xAxis + this.#cell.width;
			return new Position(xAxis, yAxis);
		}

		if(this.#direction.xAxis !== 0 && this.#direction.xAxis < 0){
			xAxis = xAxis - this.#cell.width;
			return new Position(xAxis, yAxis);
		}

		if(this.#direction.yAxis !== 0 && this.#direction.yAxis > 0){
			yAxis = yAxis + this.#cell.height;
			return new Position(xAxis, yAxis);
		}

		if(this.#direction.yAxis !== 0 && this.#direction.yAxis < 0){
			yAxis = yAxis - this.#cell.height;
			return new Position(xAxis, yAxis);	
		}

		return new Position(xAxis,yAxis);
	}

	Update(){
		var headPosition = this.#getNewPositionBasedOnDirection();
		var bd = [headPosition];
		
		if(this.#body.length > 1){
			bd = bd.concat(this.#body.slice(0,this.#body.length -1));
		}

		this.#body = bd;
		this.#headPosition = headPosition;
	}

	Collision2d(element){
		if(element instanceof Snake || element === null){
			window.alert('game over!');
		}
		
		if(element instanceof FruitHandler ){

			if(this.#validHeadPositionToEatFruit(element)){
				this.Eat(element);
			}
		}
	}

	#validHeadPositionToEatFruit(collideTo){
		if(this.#body.length === 1) return true;
				
		var collideToPosition = collideTo.Positions[0];
		if(this.#body.length > 1 
			&& collideToPosition.xAxis === this.#headPosition.xAxis
			&& collideToPosition.yAxis === this.#headPosition.yAxis) return true;


		return false;
	}

	#validDirection(direction){
		if(direction.xAxis === 0 && direction.yAxis === 0) return false;


		var currentDirection = new Position(this.#direction.xAxis, this.#direction.yAxis);

		if(direction.xAxis > 0 && currentDirection.xAxis < 0 ) return false;
		
		if(direction.xAxis < 0 && currentDirection.xAxis > 0 ) return false;

		if(direction.yAxis > 0 && currentDirection.yAxis < 0 ) return false;
		
		if(direction.yAxis < 0 && currentDirection.yAxis > 0 ) return false;

		return true;
	}

	Direction(position){
		if(this.#available === false) return;
		if((position instanceof Position) === false) throw new Error('argument position is not instance of Position');
		if(!this.#validDirection(position)) return;
		
		this.#direction = new Position(position.xAxis, position.yAxis);
		this.#available = false;
	}

	get Cell(){
		return this.#cell;
	}

	get Style(){
		return this.#style;
	}

	set Style(style){
		if(typeof style !== 'string') throw new Error('argument style is not type of string');
		this.#style = style;
	}
	
	AfterUpdate(){
		this.#available = true;
	}

	get Score(){
		return this.#score;
	}
}

class Cell{
	#width;
	#height;
	constructor(width, height){
		if(typeof width !== 'number' || Number.isNaN(width)
			|| typeof height !== 'number' || Number.isNaN(height))
			throw new Error('Invalid width or height type');
		this.#width = width;
		this.#height = height;
	}
	get width(){ return this.#width; }
	get height(){ return this.#height; }
}

class Position {
	#x;
	#y;
	constructor(x , y){
		if(typeof x !== 'number' || Number.isNaN(x)
			|| typeof y !== 'number' || Number.isNaN(y))
			throw new Error('Invalid position type');

		this.#x = x;
		this.#y = y;
	}
	get xAxis(){ return this.#x; }
	get yAxis(){ return this.#y; }
}

class FruitHandler{
	#positions;
	#cell;
	#currentFruit;
	#canvasCell;
	constructor(cell, canvasCell){
		if((cell instanceof Cell) === false) throw new Error('argument cell is not instance of Cell');
		if((canvasCell instanceof Cell) === false) throw new Error('argument canvasCell is not instance of Cell');
		this.#cell = new Cell(cell.width , cell.height);
		this.#currentFruit = null;
		this.#positions = [];
		this.#canvasCell = canvasCell;
	}

	get Positions(){
		return this.#positions;
	}

	#addNewFruit(){
		var xAxis = Math.floor(Math.random() * this.#canvasCell.width);
		var yAxis = Math.floor(Math.random() * this.#canvasCell.height);

		var xToString = xAxis.toString();
		xToString = xToString.slice(0, xToString.length - 1) + '0';


		var yToString = yAxis.toString();
		yToString = yToString.slice(0, yToString.length - 1) + '0';

		this.#currentFruit = new Position(Number.parseInt(xToString),Number.parseInt(yToString));
		this.#positions = [this.#currentFruit];
	}

	Update(){
		if(!this.#currentFruit){
			this.#addNewFruit();
			return;
		}
	}

	Collision2d(element){
		if(element === null){//bug? fruit cannot be out of border
			window.alert('fruit is out of range');
		}
	}

	RemoveFruitFromContext(){
		this.#currentFruit = null;
	}

	get Score(){
		return 10;
	}

	get Cell(){
		return this.#cell;
	}

	get Style(){
		return 'green';
	}
}