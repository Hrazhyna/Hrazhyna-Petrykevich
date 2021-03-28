// RequestAnimFrame: API браузера для получения плавной анимации
window.requestAnimFrame = ( function(){
	return  window.requestAnimationFrame   || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame    || 
		window.oRequestAnimationFrame      || 
		window.msRequestAnimationFrame     ||  
		function( callback ){
			return window.setTimeout(callback, 1000 / 60);
		};
})();

window.cancelRequestAnimFrame = ( function() {
	return window.cancelAnimationFrame           ||
		window.webkitCancelRequestAnimationFrame ||
		window.mozCancelRequestAnimationFrame    ||
		window.oCancelRequestAnimationFrame      ||
		window.msCancelRequestAnimationFrame     ||
		clearTimeout
})();

'use strict'

// инициализация canvas и нужных переменных
var savedName;
var rec = document.getElementById("record");
var nikGame = document.getElementById("nik"); // имя игрока
var ajaxHandlerScript = "https://fe.it-academy.by/AjaxStringStorage2.php"; // сервер
var updatePassword; // пароль
var dispRec = [];
var stringName='HRAZHYNA_PETRYKEVICH_GAME';
var canvas = document.getElementById("canvas"),
		ctx = canvas.getContext("2d"), 
		W = window.innerWidth, // длина окна 
		H = window.innerHeight, // высота окна 
		particles = [], // массив, содержащий частички
		ball = {}, // мяч
		paddles = [2], // массив, содержащий 2 досточки
		mouse = {}, // объект мыши для хранения её текущего положения
		points = 0, // переменная для счёта
		fps = 60, // Max FPS (кадр в секунду)
		particlesCount = 20, // количество частиц, когда мяч касается досточки
		flag = 0, // переменная счёта, которая меняется при столкновении
		particlePos = {}, // объект, который содержит позицию удара 
		multipler = 1, // контроль направления искр
		startBtn = {}, // кнопка старт
		restartBtn = {}, // кнопка рестарт
		recordBtn = {},
		over = 0, // счётчик игры
		init, // инициализация анимации
	paddleHit;

        
// подписка на события мыши на canvas
canvas.addEventListener("mousemove", trackPosition, true);
canvas.addEventListener("mousedown", btnClick, true);


// подписка на события тача
canvas.addEventListener("touchmove", trackPosition, true);
canvas.addEventListener("touchdown", btnClick, true);

// инициализация музыки при ударе
collision = document.getElementById("collide");

// установка размеров canvas на весь экран
canvas.width = W;
canvas.height = H;

// отрисовка фона
function paintCanvas() {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, W, H);
}

// отрисовка досточек
function Paddle(pos) {
	// ширина и высота
	this.h = 5;
	this.w = 150;
	
	// позиция
	this.x = W/2 - this.w/2;
	this.y = (pos == "top") ? 0 : H - this.h;
	
}


// помещаем 2 новые досточки в массив
paddles.push(new Paddle("bottom"));
paddles.push(new Paddle("top"));

// мячик
ball = {
	x: 50,
	y: 50, 
	r: 5,
	c: "white",
	vx: 4, // скорость мячика
	vy: 8,
	
	// отрисовка мяча
	draw: function() {
		ctx.beginPath();
		ctx.fillStyle = this.c;
		ctx.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
		ctx.fill();
	}
};


// отрисовка кнопки старт
startBtn = {
	w: 100,
	h: 50,
	x: W/2 - 50,
	y: H/2 - 25,
	
	draw: function() {
		ctx.strokeStyle = "white";
		ctx.lineWidth = "2";
		ctx.strokeRect(this.x, this.y, this.w, this.h);
		
		ctx.font = "18px Arial, sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStlye = "white";
		ctx.fillText("Start", W/2, H/2 );
	}
};

// отрисовка кнопки рестарт
restartBtn = {
	w: 100,
	h: 50,
	x: W/2 - 50,
	y: H/2 - 50,
	
	draw: function() {
		ctx.strokeStyle = "white";
		ctx.lineWidth = "2";
		ctx.strokeRect(this.x, this.y, this.w, this.h);
		
		ctx.font = "18px Arial, sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStlye = "white";
		ctx.fillText("Restart", W/2, H/2 - 25 );
	}
};
// кнопка рекорд
// recordBtn = {
// 	w: 100,
// 	h: 50,
// 	x: W/2 - 50,
// 	y: H/2 + 10,
	
// 	draw: function() {
// 		ctx.strokeStyle = "white";
// 		ctx.lineWidth = "2";
// 		ctx.strokeRect(this.x, this.y, this.w, this.h);
		
// 		ctx.font = "18px Arial, sans-serif";
// 		ctx.textAlign = "center";
// 		ctx.textBaseline = "middle";
// 		ctx.fillStlye = "white";
// 		ctx.fillText("Record", W/2, H/2 + 35);
// 	}
// };

// создание частичек
function createParticles(x, y, m) {
	this.x = x || 0;
	this.y = y || 0;
	
	this.radius = 1.2;
	
	this.vx = -1.5 + Math.random()*3;
	this.vy = m * Math.random()*1.5;
}

// отрисовка частиц
function draw() {
	paintCanvas();
	for(var i = 0; i < paddles.length; i++) {
		p = paddles[i];
		
		ctx.fillStyle = "white";
		ctx.fillRect(p.x, p.y, p.w, p.h);
	}
	
	ball.draw();
	update();
}

// увеличение скорости мяча после каждых 5 очков 
function increaseSpd() {
	if(points % 4 == 0) {
		if(Math.abs(ball.vx) < 15) {
			ball.vx += (ball.vx < 0) ? -1 : 1;
			ball.vy += (ball.vy < 0) ? -2 : 2;
		}
	}
}

// отслеживание положения курсора мыши
function trackPosition(e) {
	mouse.x = e.pageX;
    mouse.y = e.pageY;
    
}

// обновление позиции, очков, игры
// логика игры
function update() {
	
	// обновление скорости
	updateScore(); 
	
	// движение досточек за мышью
	if(mouse.x && mouse.y) {
		for(var i = 1; i < paddles.length; i++) {
			p = paddles[i];
			p.x = mouse.x - p.w/2;
		}		
	}
	
	// движение мяча
	ball.x += ball.vx;
	ball.y += ball.vy;
	
	// столкновение с досточками
	p1 = paddles[1];
	p2 = paddles[2];
	
	// если мячик ударяется с досточкой, то меняется вектор скорости мячика по у,
	// увеличивается счёт, проигрывает звук удара, сохраняется положение столкновения,
	// чтобы из этого положения могли вылетать частички, в переменную и изменяется
	// направление частичек
	
	if(collides(ball, p1)) {
		collideAction(ball, p1);
	}
	
	
	else if(collides(ball, p2)) {
		collideAction(ball, p2);
	} 
	
	else {
		// конец игры, если было столкновение со стенами в вверху и внизу
		
		if(ball.y + ball.r > H) {
			ball.y = H - ball.r;
			gameOver();
		} 
		
		else if(ball.y < 0) {
			ball.y = ball.r;
			gameOver();
		}
		
		// столкновение мячика с вертикальными стенами
		if(ball.x + ball.r > W) {
			ball.vx = -ball.vx;
			ball.x = W - ball.r;
		}
		
		else if(ball.x -ball.r < 0) {
			ball.vx = -ball.vx;
			ball.x = ball.r;
		}
	}
	
	
	
	// запуск частичек
	if(flag == 1) { 
		for(var k = 0; k < particlesCount; k++) {
			particles.push(new createParticles(particlePos.x, particlePos.y, multiplier));
		}
	}	
	
		emitParticles();
	
	// сбрасывание значения
	flag = 0;
}

// проверка столкновения мячика и досточек
function collides(b, p) {
	if(b.x + ball.r >= p.x && b.x - ball.r <=p.x + p.w) {
		if(b.y >= (p.y - p.h) && p.y > 0){
			paddleHit = 1;
			return true;
		}
		
		else if(b.y <= p.h && p.y == 0) {
			paddleHit = 2;
			return true;
		}
		
		else return false;
	}
}

//если столкновение было == true
function collideAction(ball, p) {
	ball.vy = -ball.vy;
	
	if(paddleHit == 1) {
		ball.y = p.y - p.h;
		particlePos.y = ball.y + ball.r;
		multiplier = -1;	
	}
	
	else if(paddleHit == 2) {
		ball.y = p.h + ball.r;
		particlePos.y = ball.y - ball.r;
		multiplier = 1;	
	}
	
	points++;
	increaseSpd();
	
	if(collision) {
		if(points > 0) 
			collision.pause();
		
		collision.currentTime = 0;
		collision.play();
	}
	
	particlePos.x = ball.x;
	flag = 1;
}

// анимация частичек
function emitParticles() { 
	for(var j = 0; j < particles.length; j++) {
		par = particles[j];
		
		ctx.beginPath(); 
		ctx.fillStyle = "white";
		if (par.radius > 0) {
			ctx.arc(par.x, par.y, par.radius, 0, Math.PI*2, false);
		}
		ctx.fill();	 
		
		par.x += par.vx; 
		par.y += par.vy; 
		
		// конец анимации частичек
		par.radius = Math.max(par.radius - 0.05, 0.0); 
		
	} 
}

// обновление рекорда
function updateScore() {
	ctx.fillStlye = "white";
	ctx.font = "16px Arial, sans-serif";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText("Score: " + points, 20, 20 );
}

// запуск конца игры

function gameOver() {
	ctx.fillStlye = "white";
	ctx.font = "20px Arial, sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText("Game Over - You scored " + points + " points!", W / 2, H / 2 + 90);
	nikGame.style.opacity = "1";
	nikGame.style.visibility = "visible";
	
	// конец анимации
	cancelRequestAnimFrame(init);
	
	// счётчик игры
	over = 1;
	
	// отрисовка кнопки рестарт
	restartBtn.draw();
	// recordBtn.draw();
}
function nikname() {
	nikGame.style.opacity = "0";
	nikGame.style.visibility = "hidden";
	 updatePassword=Math.random();
    $.ajax( {
            url : ajaxHandlerScript,
            type : 'POST', dataType:'json',
            data : { f : 'LOCKGET', n : stringName,
                p : updatePassword },
            cache : false,
            success : lockGetReady,
            error : errorHandler
        }
    );
}
function lockGetReady(callresult) {
    if ( callresult.error!=undefined )
        alert(callresult.error);
    else {
        dispRec = [];
        if ( callresult.result!="" ) { 
            dispRec=JSON.parse(callresult.result);
            if ( !Array.isArray(dispRec) )
                dispRec=[];
        }
        var iname = document.getElementById('input').value;
        var item = points;
        dispRec.push( { name:iname, mess:item } );
        if ( dispRec.length>10 )
            dispRec=dispRec.slice(dispRec.length-10);

         $.ajax( {
             url : ajaxHandlerScript,
             type : 'POST', dataType:'json',
             data : { f : 'UPDATE', n : stringName,
                v : JSON.stringify(dispRec), p : updatePassword },
             cache : false,
             success : updateReady,
            error : errorHandler
            }
        );
    }
}
function updateReady(callresult) {
    if ( callresult.error!=undefined )
        alert(callresult.error);
}

function errorHandler(jqXHR,statusStr,errorStr) {
    alert(statusStr+' '+errorStr);
}

// запуск общей анимации
function animcycle() {
	init = requestAnimFrame(animcycle);
	draw();
}

// старт игры
function startScreen() {
	draw();
	startBtn.draw();
}


// нажата кнопка (Restart, start, record)
function btnClick(e) {
	
	//  сохранение положения мыши при нажатии
	var mx = e.pageX,
			my = e.pageY;
	
	// нажата кнопка старт
	if(mx >= startBtn.x && mx <= startBtn.x + startBtn.w) {
		animcycle();
		
		// удаление кнопки запуска после нажатия на неё
		startBtn = {};
	}
	
	// если игра окончена и нажата кнопка перезапуска
	if(over == 1) {
		if(mx >= restartBtn.x && mx <= restartBtn.x + restartBtn.w) {
			ball.x = 20;
			ball.y = 20;
			points = 0;
			ball.vx = 4;
			ball.vy = 8;
			animcycle();
			
			over = 0;
		}
	}
	// // если нажата кнопка рекорд
	// if(mx >= recordBtn.x && mx <= recordBtn.x + recordBtn.w) {
	// 		rec.style.opacity = "1";
	// 		rec.style.visibility = "visible";
			
	// 	}
	
}

// запуск стартовой страницы
startScreen();

