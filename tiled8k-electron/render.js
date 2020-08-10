document.body.style.cssText = `
  margin: 0px;
`;

const queryParams = new URLSearchParams(location.search);
const calibrationB64 = queryParams.get('calibration');
const calibrationString = atob(calibrationB64);
const calibration = JSON.parse(calibrationString);

const gridSize = calibration.grid.x * calibration.grid.y;
const imageWidth = window.innerWidth / 2;
const imageHeight = gridSize == 2 ? window.innerHeight : window.innerHeight / 2;

const images = [];
for (let i = 0; i < gridSize; i++) {
  const img = document.createElement('img');
  img.style.cssText = `
    height: ${imageHeight};
    left: ${i == 0 || i == 2 ? 0 : imageWidth}px;
    position: fixed;
    top: ${i == 0 || i == 1 ? 0 : imageHeight}px;
    width: ${imageWidth}px;
  `;
  document.body.appendChild(img);
  images.push(img);
}

const messageBus = new BroadcastChannel('messagebus');
messageBus.addEventListener('message', (e) => {
  const msg = e.data;

  if (msg.id >= gridSize) {
    console.error('invalid id');
    return;
  }

  images[msg.id].src = URL.createObjectURL(msg.image);
});
