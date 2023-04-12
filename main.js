const canvas = document.querySelector('canvas');

const canvasWidth = canvas.width = window.innerWidth;
const canvasHeight = canvas.height = window.innerHeight;

const ctx = canvas.getContext('2d');

const clients = new Map();
let mySquare;

// Square class
class Square {
  constructor(id, x, y, width, height, color) {
    this.id = id;
    this._x = x;
    this._y = y;
    this.width = width;
    this.height = height;
    this.color = color;

    if(this.id === sockets.id) {
      this.handleKeyboard();
    }
  }

  get x() {return this._x;}

  set x(value) {
    this._x = value;
    this.onPositionChanged();
  }

  get y() {return this._y;}

  set y(value) {
    this._y = value;
    this.onPositionChanged();
  }

  // Render square function
  render() {

    // Not to render if not in clients
    if(!clients.get(this.id) && this.id !== sockets.id) return;

    ctx.fillStyle = this.color;
    ctx.fillRect(this._x, this._y, this.width, this.height);
  }

  handleKeyboard() {
    window.addEventListener('keydown', (event) => {
      if(event.key.toLowerCase() === 'w') this.y -= 5;
      if(event.key.toLowerCase() === 's') this.y += 5;
      if(event.key.toLowerCase() === 'a') this.x -= 5;
      if(event.key.toLowerCase() === 'd') this.x += 5;
    });
  }

  onPositionChanged() {
    sockets.emit('CLIENT_POSITION_CHANGED', {
      x: this._x,
      y: this._y
    });
  }
}

// Initalize sockets
const sockets = io('localhost:8000');

sockets.on('connect', () => {
  console.log(`Connected to server. Socket ID: ${sockets.id}`);

  init();
});

// Generate random number function
function randomNumber(min = 0, max = Number.MAX_SAFE_INTEGER) {
  return Math.round(Math.random() * (max - min) + min);
}

// Generate random color function
function randomColor() {
  return `#${randomNumber(0, 255).toString(16)}${randomNumber(0, 255).toString(16)}${randomNumber(0, 255).toString(16)}`;
}

// Initialise rerender function
function doRerenders() {
  requestAnimationFrame(doRerenders);

  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Render my square
  mySquare.render();

  // Render all clients
  for(const key of clients.keys()) {
    const clientData = clients.get(key);

    clientData.square.render();
  }
}

// Initialize our controlled square function
function init() {
  const squareSize = randomNumber(10, 100);
  const squareColor = randomColor();
  const squareX = canvasWidth / 2 - squareSize / 2;
  const squareY = canvasHeight / 2 - squareSize / 2;

  mySquare = new Square(sockets.id, squareX, squareY, squareSize, squareSize, squareColor);

  // Register on server
  sockets.emit('REGISTER', {
    x: squareX,
    y: squareY,
    squareSize,
    squareColor
  });

  // Run rerenders
  doRerenders();
}

// On new client
sockets.on('NEW_CLIENT', (squareData) => {

  // If me, ignore
  if(squareData.id === sockets.id) return;

  // Draw client square
  const clientSquare = new Square(
    squareData.id,
    squareData.x,
    squareData.y,
    squareData.squareSize,
    squareData.squareSize,
    squareData.squareColor
  );

  // Save client data
  clients.set(squareData.id, {
    ...squareData,
    square: clientSquare
  });

  console.log(`Client ${squareData.id} joined`);
});

// On client leaved
sockets.on('CLIENT_LEAVED', (clientId) => {
  clients.delete(clientId);

  console.log(`Client ${clientId} leaved`);
});

// On client position changed
sockets.on('CLIENT_POSITION_CHANGED', (clientData) => {

  // Ignore if it's me
  if(clientData.id === sockets.id) return;

  /* Change client position */

  const oldClientData = clients.get(clientData.id);

  clients.set(clientData.id, {
    ...oldClientData,
    ...clientData,
  });

  oldClientData.square._x = clientData.x;
  oldClientData.square._y = clientData.y;
});
